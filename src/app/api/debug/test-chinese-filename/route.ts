import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const UPLOAD_TEMP_DIR = '/tmp/uploads';

export async function POST() {
  try {
    console.log('[Test Chinese Filename] Starting test...');

    // 创建测试文件（5MB）
    const testBuffer = Buffer.alloc(5 * 1024 * 1024, 'd');
    const fileId = `test-cn-${Date.now()}`;
    const fileName = '宝莲灯.glb'; // 包含中文
    const totalChunks = 2;

    console.log('[Test Chinese Filename] Creating chunks:', { totalChunks, fileId, fileName });

    // 确保临时目录存在
    await fs.mkdir(UPLOAD_TEMP_DIR, { recursive: true });

    const CHUNK_SIZE = 4 * 1024 * 1024;

    // 分割并上传分块
    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, testBuffer.length);
      const chunkBuffer = testBuffer.slice(start, end);

      const chunkPath = path.join(UPLOAD_TEMP_DIR, `${fileId}.chunk.${i}`);
      await fs.writeFile(chunkPath, chunkBuffer);
    }

    // 合并分块
    const chunks: Buffer[] = [];
    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = path.join(UPLOAD_TEMP_DIR, `${fileId}.chunk.${i}`);
      const chunkBuffer = await fs.readFile(chunkPath);
      chunks.push(chunkBuffer);
    }

    const mergedBuffer = Buffer.concat(chunks);
    console.log('[Test Chinese Filename] Merged buffer size:', mergedBuffer.length);

    // 上传到S3 - 使用文件名清理逻辑
    const { S3Storage } = await import('coze-coding-dev-sdk');
    const storage = new S3Storage({
      endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
      accessKey: '',
      secretKey: '',
      bucketName: process.env.COZE_BUCKET_NAME,
      region: 'cn-beijing',
    });

    // 模拟实际上传逻辑中的文件名处理
    const fileExt = fileName.split('.').pop() || 'glb';
    const safeBaseName = fileName
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .substring(0, 50);
    const finalFileName = `models/${Date.now()}_${safeBaseName}`;

    console.log('[Test Chinese Filename] Uploading to S3:', finalFileName, '(original:', fileName, ')');

    const key = await storage.uploadFile({
      fileContent: mergedBuffer,
      fileName: finalFileName,
      contentType: 'application/octet-stream',
    });

    console.log('[Test Chinese Filename] Upload successful, key:', key);

    // 验证
    const readResult = await storage.readFile({ fileKey: key });

    // 清理
    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = path.join(UPLOAD_TEMP_DIR, `${fileId}.chunk.${i}`);
      try {
        await fs.unlink(chunkPath);
      } catch (e) {
        // ignore
      }
    }

    return NextResponse.json({
      success: true,
      key,
      originalFileName: fileName,
      safeFileName: finalFileName,
      originalSize: testBuffer.length,
      readSize: readResult.length,
    });
  } catch (error) {
    console.error('[Test Chinese Filename] Error:', error);

    return NextResponse.json(
      {
        error: 'Test failed',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
