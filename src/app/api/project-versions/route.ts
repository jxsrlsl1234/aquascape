import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { projectVersions } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, length, width, height, glassThickness, waterLevel, items } = body;

    if (!length || !width || !height) {
      return NextResponse.json(
        { error: '缺少必要的鱼缸尺寸参数' },
        { status: 400 }
      );
    }

    const versionName = name || '未命名版本';

    // 检查是否存在同名版本
    const existingVersions = await db
      .select()
      .from(projectVersions)
      .where(eq(projectVersions.name, versionName))
      .limit(1);

    let result;

    if (existingVersions.length > 0) {
      // 存在同名版本，更新
      const existingVersion = existingVersions[0];
      result = await db
        .update(projectVersions)
        .set({
          length: parseFloat(length),
          width: parseFloat(width),
          height: parseFloat(height),
          glassThickness: parseFloat(glassThickness) || 1, // 厘米
          waterLevel: parseFloat(waterLevel) || 50, // 厘米
          items,
        })
        .where(eq(projectVersions.id, existingVersion.id))
        .returning();
    } else {
      // 不存在同名版本，插入新版本
      result = await db.insert(projectVersions).values({
        name: versionName,
        length: parseFloat(length),
        width: parseFloat(width),
        height: parseFloat(height),
        glassThickness: parseFloat(glassThickness) || 1, // 厘米
        waterLevel: parseFloat(waterLevel) || 50, // 厘米
        items,
      }).returning();
    }

    return NextResponse.json({ success: true, data: result[0] });
  } catch (error) {
    console.error('保存项目版本失败:', error);
    return NextResponse.json(
      { error: '保存项目版本失败' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const versions = await db
      .select()
      .from(projectVersions)
      .orderBy(projectVersions.createdAt);

    return NextResponse.json({ success: true, data: versions });
  } catch (error) {
    console.error('获取项目版本列表失败:', error);
    return NextResponse.json(
      { error: '获取项目版本列表失败' },
      { status: 500 }
    );
  }
}
