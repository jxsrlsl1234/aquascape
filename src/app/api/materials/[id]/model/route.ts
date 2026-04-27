import { NextRequest, NextResponse } from 'next/server';
import { materialManager } from '@/db/materialManager';
import { S3Storage } from 'coze-coding-dev-sdk';

const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: '',
  secretKey: '',
  bucketName: process.env.COZE_BUCKET_NAME,
  region: 'cn-beijing',
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const material = await materialManager.getMaterialById(parseInt(id));

    if (!material) {
      return NextResponse.json(
        { error: 'Material not found' },
        { status: 404 }
      );
    }

    // 兼容旧数据：如果有modelUrl直接返回
    if (!material.modelKey && 'modelUrl' in material && material.modelUrl) {
      return NextResponse.json({ url: (material as any).modelUrl });
    }

    // 新数据：从modelKey生成签名URL
    if (!material.modelKey) {
      return NextResponse.json(
        { error: 'No model key found' },
        { status: 404 }
      );
    }

    // 生成签名URL（有效期1年）
    const url = await storage.generatePresignedUrl({
      key: material.modelKey,
      expireTime: 31536000, // 1年
    });

    return NextResponse.json({ url });
  } catch (error) {
    console.error('Error generating model URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate model URL' },
      { status: 500 }
    );
  }
}
