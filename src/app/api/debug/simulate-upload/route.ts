import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('[Simulate Upload] Starting simulation...');

    const body = await request.json();
    const { fileSizeMB = 10 } = body; // 默认模拟10MB文件

    const fileSize = fileSizeMB * 1024 * 1024;
    const CHUNK_SIZE = 4 * 1024 * 1024; // 4MB
    const totalChunks = Math.ceil(fileSize / CHUNK_SIZE);

    console.log('[Simulate Upload] Parameters:', {
      fileSizeMB,
      fileSize,
      totalChunks,
      CHUNK_SIZE,
    });

    // 生成测试数据
    const testBuffer = Buffer.alloc(fileSize, 'c');
    const fileId = `sim-${Date.now()}`;
    const fileName = `test-${fileSizeMB}mb.bin`;

    // 上传所有分块
    const uploadPromises = [];

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, testBuffer.length);
      const chunk = testBuffer.slice(start, end);

      const formData = new FormData();
      const file = new File([chunk], `chunk.${chunkIndex}`);
      formData.append('file', file);
      formData.append('chunkIndex', chunkIndex.toString());
      formData.append('totalChunks', totalChunks.toString());
      formData.append('fileId', fileId);
      formData.append('fileName', fileName);

      const uploadPromise = fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000'}/api/upload/chunk`, {
        method: 'POST',
        body: formData,
      });

      uploadPromises.push(uploadPromise);
    }

    console.log('[Simulate Upload] Uploading all chunks...');

    const responses = await Promise.all(uploadPromises);

    console.log('[Simulate Upload] All chunks uploaded, checking responses...');

    const lastResponse = responses[responses.length - 1];

    if (!lastResponse.ok) {
      const error = await lastResponse.json().catch(() => ({ error: 'Unknown error' }));
      console.error('[Simulate Upload] Last chunk failed:', error);
      return NextResponse.json(
        { error: 'Upload failed', chunkError: error },
        { status: 500 }
      );
    }

    const result = await lastResponse.json();
    console.log('[Simulate Upload] Final result:', result);

    if (result.status !== 'complete') {
      return NextResponse.json(
        { error: 'Upload incomplete', result },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      key: result.key,
      fileSizeMB,
      totalChunks,
    });
  } catch (error) {
    console.error('[Simulate Upload] Error:', error);

    return NextResponse.json(
      {
        error: 'Simulation failed',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
