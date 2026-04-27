import { NextResponse } from 'next/server';

export async function POST() {
  try {
    console.log('[Test Upload] Starting S3 upload test...');

    // 检查环境变量
    const endpointUrl = process.env.COZE_BUCKET_ENDPOINT_URL;
    const bucketName = process.env.COZE_BUCKET_NAME;

    console.log('[Test Upload] Environment check:', {
      hasEndpoint: !!endpointUrl,
      hasBucket: !!bucketName,
      endpoint: endpointUrl,
      bucket: bucketName,
    });

    if (!endpointUrl || !bucketName) {
      return NextResponse.json(
        { error: 'Missing environment variables' },
        { status: 500 }
      );
    }

    // 创建测试文件（1MB）
    const testBuffer = Buffer.alloc(1 * 1024 * 1024, 'a');

    console.log('[Test Upload] Creating S3Storage instance...');

    const { S3Storage } = await import('coze-coding-dev-sdk');
    const storage = new S3Storage({
      endpointUrl,
      accessKey: '',
      secretKey: '',
      bucketName,
      region: 'cn-beijing',
    });

    console.log('[Test Upload] Uploading test file...');

    const fileName = `test/test-${Date.now()}.bin`;
    const key = await storage.uploadFile({
      fileContent: testBuffer,
      fileName,
      contentType: 'application/octet-stream',
    });

    console.log('[Test Upload] Upload successful:', key);

    // 尝试读取文件以验证上传
    const readResult = await storage.readFile({ fileKey: key });
    console.log('[Test Upload] Read successful, size:', readResult.length);

    return NextResponse.json({
      success: true,
      key,
      uploadedSize: testBuffer.length,
      readSize: readResult.length,
    });
  } catch (error) {
    console.error('[Test Upload] Error:', error);

    return NextResponse.json(
      {
        error: 'Test upload failed',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
