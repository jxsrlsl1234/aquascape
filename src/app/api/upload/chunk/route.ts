import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

// 临时文件存储目录
const UPLOAD_TEMP_DIR = '/tmp/uploads';

export async function POST(request: NextRequest) {
  try {
    // 检查环境变量
    const endpointUrl = process.env.COZE_BUCKET_ENDPOINT_URL;
    const bucketName = process.env.COZE_BUCKET_NAME;

    if (!endpointUrl || !bucketName) {
      console.error('[Chunk Upload] Missing environment variables:', {
        endpointUrl: !!endpointUrl,
        bucketName: !!bucketName,
      });
      return NextResponse.json(
        { error: 'Server configuration error: missing storage configuration' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const chunkIndex = parseInt(formData.get('chunkIndex') as string);
    const totalChunks = parseInt(formData.get('totalChunks') as string);
    const fileId = formData.get('fileId') as string;
    const fileName = formData.get('fileName') as string;

    if (!file || !fileId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    console.log('[Chunk Upload] Received chunk:', {
      chunkIndex,
      totalChunks,
      fileId,
      fileName,
      fileSize: file.size,
    });

    // 确保临时目录存在
    await fs.mkdir(UPLOAD_TEMP_DIR, { recursive: true });

    // 保存分块到临时文件
    const chunkPath = path.join(UPLOAD_TEMP_DIR, `${fileId}.chunk.${chunkIndex}`);
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(chunkPath, buffer);

    console.log('[Chunk Upload] Chunk saved:', chunkPath);

    // 检查是否所有分块都已上传
    const allChunksReceived = await checkAllChunksUploaded(fileId, totalChunks);

    if (allChunksReceived) {
      // 合并所有分块
      console.log('[Chunk Upload] All chunks received, merging...');
      const mergedBuffer = await mergeChunks(fileId, totalChunks);

      console.log('[Chunk Upload] Merged buffer size:', mergedBuffer.length, 'bytes');

      // 生成最终文件名（移除中文和不安全字符）
      const fileExt = fileName.split('.').pop() || 'glb';
      const safeBaseName = fileName
        .replace(/[^a-zA-Z0-9._-]/g, '_') // 替换不允许的字符为下划线
        .substring(0, 50); // 限制长度
      const finalFileName = `models/${Date.now()}_${safeBaseName}`;
      console.log('[Chunk Upload] Uploading to S3:', finalFileName, '(original:', fileName, ')');

      try {
        // 上传到 S3
        const { S3Storage } = await import('coze-coding-dev-sdk');
        const storage = new S3Storage({
          endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
          accessKey: '',
          secretKey: '',
          bucketName: process.env.COZE_BUCKET_NAME,
          region: 'cn-beijing',
        });

        console.log('[Chunk Upload] S3Storage initialized, starting upload...');
        const fileKey = await storage.uploadFile({
          fileContent: mergedBuffer,
          fileName: finalFileName,
          contentType: 'application/octet-stream',
        });

        console.log('[Chunk Upload] Upload successful, key:', fileKey);

        // 创建完成标记文件（保存原始文件名供前端显示）
        const markerPath = path.join(UPLOAD_TEMP_DIR, `${fileId}.complete`);
        await fs.writeFile(markerPath, JSON.stringify({
          key: fileKey,
          timestamp: Date.now(),
          originalFileName: fileName,
          safeFileName: finalFileName,
        }));

        // 清理临时文件
        await cleanupChunks(fileId, totalChunks);

        return NextResponse.json({
          status: 'complete',
          key: fileKey,
        });
      } catch (s3Error) {
        console.error('[Chunk Upload] S3 upload error:', s3Error);
        return NextResponse.json(
          {
            error: 'Failed to upload to storage',
            details: s3Error instanceof Error ? s3Error.message : String(s3Error),
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      status: 'partial',
      chunkIndex,
    });
  } catch (error) {
    console.error('[Chunk Upload] Error:', error);

    // 提取详细的错误信息
    let errorMessage = 'Failed to upload chunk';
    let errorDetails = '';

    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = error.stack || '';
    }

    // 检查是否是请求体过大的错误
    if (error instanceof Error && error.message.includes('request entity too large')) {
      errorMessage = 'Chunk size exceeds limit';
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails,
      },
      { status: 500 }
    );
  }
}

async function checkAllChunksUploaded(fileId: string, totalChunks: number): Promise<boolean> {
  for (let i = 0; i < totalChunks; i++) {
    const chunkPath = path.join(UPLOAD_TEMP_DIR, `${fileId}.chunk.${i}`);
    try {
      await fs.access(chunkPath);
    } catch {
      return false;
    }
  }
  return true;
}

async function mergeChunks(fileId: string, totalChunks: number): Promise<Buffer> {
  const chunks: Buffer[] = [];

  console.log(`[Chunk Upload] Merging ${totalChunks} chunks for fileId: ${fileId}`);

  for (let i = 0; i < totalChunks; i++) {
    const chunkPath = path.join(UPLOAD_TEMP_DIR, `${fileId}.chunk.${i}`);

    try {
      const chunkBuffer = await fs.readFile(chunkPath);
      console.log(`[Chunk Upload] Read chunk ${i}: size=${chunkBuffer.length} bytes`);
      chunks.push(chunkBuffer);
    } catch (error) {
      console.error(`[Chunk Upload] Failed to read chunk ${i} from ${chunkPath}:`, error);
      throw new Error(`Failed to read chunk ${i}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  console.log(`[Chunk Upload] Concatenating ${chunks.length} chunks, total size: ${chunks.reduce((sum, chunk) => sum + chunk.length, 0)} bytes`);
  return Buffer.concat(chunks);
}

async function cleanupChunks(fileId: string, totalChunks: number) {
  for (let i = 0; i < totalChunks; i++) {
    const chunkPath = path.join(UPLOAD_TEMP_DIR, `${fileId}.chunk.${i}`);
    try {
      await fs.unlink(chunkPath);
    } catch (error) {
      console.error(`Failed to delete chunk: ${chunkPath}`, error);
    }
  }
}
