import { NextRequest, NextResponse } from 'next/server';
import { materialManager } from '@/db/materialManager';
import { insertMaterialSchema } from '@/db/schema';
import { S3Storage } from 'coze-coding-dev-sdk';

const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: '',
  secretKey: '',
  bucketName: process.env.COZE_BUCKET_NAME,
  region: 'cn-beijing',
});

// 为素材生成模型URL（兼容新旧数据）
async function generateModelUrl(material: any) {
  // 新数据：使用modelKey生成签名URL
  if (material.modelKey) {
    try {
      const url = await storage.generatePresignedUrl({
        key: material.modelKey,
        expireTime: 31536000, // 1年
      });
      return { ...material, modelUrl: url };
    } catch (error) {
      console.error('Error generating URL for material:', material.id, error);
      return material;
    }
  }

  // 旧数据：直接返回modelUrl
  return material;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || undefined;
    const search = searchParams.get('search') || undefined;
    const limit = parseInt(searchParams.get('limit') || '100');
    const skip = parseInt(searchParams.get('skip') || '0');

    const materialsList = await materialManager.getMaterials({
      type,
      search,
      limit,
      skip,
    });

    // 为每个素材动态生成模型URL
    const materialsWithUrls = await Promise.all(
      materialsList.map(generateModelUrl)
    );

    return NextResponse.json(materialsWithUrls);
  } catch (error) {
    console.error('Error fetching materials:', error);
    return NextResponse.json(
      { error: 'Failed to fetch materials' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = insertMaterialSchema.parse(body);

    const material = await materialManager.createMaterial(validated);

    return NextResponse.json(material, { status: 201 });
  } catch (error) {
    console.error('Error creating material:', error);
    return NextResponse.json(
      { error: 'Failed to create material' },
      { status: 500 }
    );
  }
}
