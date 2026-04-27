import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const UPLOAD_TEMP_DIR = '/tmp/uploads';

export async function POST() {
  try {
    console.log('[Test Chunk Upload] Starting chunked upload test...');

    // 创建测试文件（5MB）
    const testBuffer = Buffer.alloc(5 * 1024 * 1024, 'b');
    const fileId = `test-${Date.now()}`;
    const totalChunks = 2; // 每块4MB，5MB需要2块
    const CHUNK_SIZE = 4 * 1024 * 1024;

    console.log('[Test Chunk Upload] Creating chunks:', { totalChunks, fileId });

    // 确保临时目录存在
    await fs.mkdir(UPLOAD_TEMP_DIR, { recursive: true });

    // 分割并上传分块
    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, testBuffer.length);
      const chunkBuffer = testBuffer.slice(start, end);

      const chunkPath = path.join(UPLOAD_TEMP_DIR, `${fileId}.chunk.${i}`);
      await fs.writeFile(chunkPath, chunkBuffer);

      console.log(`[Test Chunk Upload] Chunk ${i} saved:`, {
        size: chunkBuffer.length,
        path: chunkPath,
      });
    }

    // 合并分块
    const chunks: Buffer[] = [];
    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = path.join(UPLOAD_TEMP_DIR, `${fileId}.chunk.${i}`);
      const chunkBuffer = await fs.readFile(chunkPath);
      chunks.push(chunkBuffer);
    }

    const mergedBuffer = Buffer.concat(chunks);
    console.log('[Test Chunk Upload] Merged buffer size:', mergedBuffer.length);

    // 上传到S3
    const { S3Storage } = await import('coze-coding-dev-sdk');
    const storage = new S3Storage({
      endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
      accessKey: '',
      secretKey: '',
      bucketName: process.env.COZE_BUCKET_NAME,
      region: 'cn-beijing',
    });

    const fileName = `test/chunk-test-${Date.now()}.bin`;
    const key = await storage.uploadFile({
      fileContent: mergedBuffer,
      fileName,
      contentType: 'application/octet-stream',
    });

    console.log('[Test Chunk Upload] Upload successful:', key);

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
      originalSize: testBuffer.length,
      mergedSize: mergedBuffer.length,
      readSize: readResult.length,
    });
  } catch (error) {
    console.error('[Test Chunk Upload] Error:', error);

    return NextResponse.json(
      {
        error: 'Test chunked upload failed',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
