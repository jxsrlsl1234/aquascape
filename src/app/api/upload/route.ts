import { NextRequest, NextResponse } from 'next/server';
import { S3Storage } from 'coze-coding-dev-sdk';

const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: '',
  secretKey: '',
  bucketName: process.env.COZE_BUCKET_NAME,
  region: 'cn-beijing',
});

// 配置 API 路由的最大运行时间
export const maxDuration = 300; // 5分钟
export const dynamic = 'force-dynamic';

// 配置 API 路由的响应选项
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  console.log('[Upload API] Request received');
  console.log('[Upload API] Headers:', {
    'content-type': request.headers.get('content-type'),
    'content-length': request.headers.get('content-length'),
    'user-agent': request.headers.get('user-agent'),
  });

  try {
    console.log('[Upload API] Starting upload request...');
    console.log('[Upload API] Content-Type:', request.headers.get('content-type'));
    console.log('[Upload API] Content-Length:', request.headers.get('content-length'));

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.error('[Upload API] No file provided');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log('[Upload API] File received:', {
      name: file.name,
      size: file.size,
      type: file.type,
      sizeMB: (file.size / 1024 / 1024).toFixed(2) + 'MB'
    });

    // 验证文件大小不超过 100MB
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      console.error('[Upload API] File size exceeds limit');
      return NextResponse.json(
        { error: `File size exceeds 100MB limit (current: ${(file.size / 1024 / 1024).toFixed(2)}MB)` },
        { status: 413 }
      );
    }

    // 生成唯一的文件名
    const fileName = `${Date.now()}_${file.name}`;
    const keyName = `models/${fileName}`;

    console.log('[Upload API] Reading file content...');
    // 读取文件内容
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    console.log('[Upload API] Buffer created, size:', buffer.length);

    console.log('[Upload API] Uploading to S3 storage...');
    // 上传到对象存储
    const fileKey = await storage.uploadFile({
      fileContent: buffer,
      fileName: keyName,
      contentType: file.type || 'application/octet-stream',
    });

    console.log('[Upload API] Upload successful, key:', fileKey);

    // 返回fileKey（永久有效），不返回签名URL
    return NextResponse.json({
      key: fileKey,
      fileName,
    });
  } catch (error) {
    console.error('[Upload API] Error uploading file:', error);
    console.error('[Upload API] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error
    });
    return NextResponse.json(
      { error: 'Failed to upload file', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
