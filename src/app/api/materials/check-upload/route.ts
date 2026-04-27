import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const UPLOAD_TEMP_DIR = '/tmp/uploads';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fileId = searchParams.get('fileId');

    if (!fileId) {
      return NextResponse.json(
        { error: 'Missing fileId parameter' },
        { status: 400 }
      );
    }

    // 检查是否有标记文件（记录上传完成）
    const markerPath = path.join(UPLOAD_TEMP_DIR, `${fileId}.complete`);

    try {
      const markerContent = await fs.readFile(markerPath, 'utf-8');
      const data = JSON.parse(markerContent);

      // 删除标记文件
      await fs.unlink(markerPath).catch(() => {});

      return NextResponse.json({
        status: 'complete',
        key: data.key,
      });
    } catch (e) {
      // 标记文件不存在，上传还未完成
      return NextResponse.json({
        status: 'pending',
      });
    }
  } catch (error) {
    console.error('[Check Upload] Error:', error);
    return NextResponse.json(
      { error: 'Check upload failed' },
      { status: 500 }
    );
  }
}
