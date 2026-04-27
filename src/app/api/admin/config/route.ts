import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { siteConfig } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

// 验证管理员权限
async function verifyAdminAuth(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (!payload.isAdmin) {
      return null;
    }
    return payload;
  } catch (error) {
    return null;
  }
}

// GET - 获取首页配置
export async function GET(request: NextRequest) {
  try {
    const configs = await db.select().from(siteConfig);
    
    // 转换为键值对象
    const configMap: Record<string, string> = {};
    configs.forEach(config => {
      configMap[config.configKey] = config.configValue;
    });

    return NextResponse.json({
      success: true,
      data: configMap,
    });
  } catch (error) {
    console.error('获取配置失败:', error);
    return NextResponse.json(
      { error: '获取配置失败' },
      { status: 500 }
    );
  }
}

// POST - 更新首页配置
export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限
    const auth = await verifyAdminAuth(request);
    if (!auth) {
      return NextResponse.json(
        { error: '未授权' },
        { status: 401 }
      );
    }

    const { configKey, configValue, description } = await request.json();

    if (!configKey || configValue === undefined) {
      return NextResponse.json(
        { error: '配置键和值不能为空' },
        { status: 400 }
      );
    }

    // 检查配置是否存在
    const existing = await db
      .select()
      .from(siteConfig)
      .where(eq(siteConfig.configKey, configKey))
      .limit(1);

    if (existing.length > 0) {
      // 更新现有配置
      await db
        .update(siteConfig)
        .set({
          configValue,
          description: description || existing[0].description,
          updatedAt: new Date(),
        })
        .where(eq(siteConfig.configKey, configKey));
    } else {
      // 创建新配置
      await db.insert(siteConfig).values({
        configKey,
        configValue,
        description,
      });
    }

    return NextResponse.json({
      success: true,
      message: '配置更新成功',
    });
  } catch (error) {
    console.error('更新配置失败:', error);
    return NextResponse.json(
      { error: '更新配置失败' },
      { status: 500 }
    );
  }
}
