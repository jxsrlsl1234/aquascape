import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { projectVersions } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: '无效的版本ID' },
        { status: 400 }
      );
    }

    const version = await db
      .select()
      .from(projectVersions)
      .where(eq(projectVersions.id, id))
      .limit(1);

    if (!version || version.length === 0) {
      return NextResponse.json(
        { error: '版本不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: version[0] });
  } catch (error) {
    console.error('获取项目版本失败:', error);
    return NextResponse.json(
      { error: '获取项目版本失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: '无效的版本ID' },
        { status: 400 }
      );
    }

    await db.delete(projectVersions).where(eq(projectVersions.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除项目版本失败:', error);
    return NextResponse.json(
      { error: '删除项目版本失败' },
      { status: 500 }
    );
  }
}
