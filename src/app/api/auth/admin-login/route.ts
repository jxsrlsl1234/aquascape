import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { admins, loginRecords } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

async function generateToken(userId: number, isAdmin: boolean) {
  const token = await new SignJWT({ userId, isAdmin })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
  return token;
}

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // 验证用户名和密码
    if (!username || !password) {
      return NextResponse.json(
        { error: '用户名和密码不能为空' },
        { status: 400 }
      );
    }

    // 查找管理员
    const admin = await db.select().from(admins).where(eq(admins.username, username)).limit(1);

    if (admin.length === 0) {
      return NextResponse.json(
        { error: '用户名或密码错误' },
        { status: 401 }
      );
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, admin[0].password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: '用户名或密码错误' },
        { status: 401 }
      );
    }

    // 更新登录时间
    await db.update(admins)
      .set({ lastLoginAt: new Date() })
      .where(eq(admins.id, admin[0].id));

    // 记录登录
    await db.insert(loginRecords).values({
      userId: admin[0].id,
      userType: 'admin',
      loginTime: new Date(),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      device: request.headers.get('user-agent') || 'unknown',
    });

    // 生成JWT token
    const token = await generateToken(admin[0].id, true);

    return NextResponse.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        admin: {
          id: admin[0].id,
          username: admin[0].username,
          name: admin[0].name,
        },
      },
    });
  } catch (error) {
    console.error('管理员登录失败:', error);
    return NextResponse.json(
      { error: '登录失败' },
      { status: 500 }
    );
  }
}
