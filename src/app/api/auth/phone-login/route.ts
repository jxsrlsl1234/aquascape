import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, loginRecords } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyCode } from '../send-code/route';
import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

async function generateToken(userId: number) {
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
  return token;
}

export async function POST(request: NextRequest) {
  try {
    const { phone, code } = await request.json();

    // 验证手机号和验证码
    if (!phone || !code) {
      return NextResponse.json(
        { error: '手机号和验证码不能为空' },
        { status: 400 }
      );
    }

    // 验证验证码
    const isValid = verifyCode(phone, code);
    if (!isValid) {
      return NextResponse.json(
        { error: '验证码错误或已过期' },
        { status: 400 }
      );
    }

    // 查找或创建用户
    let user = await db.select().from(users).where(eq(users.phone, phone)).limit(1);

    if (user.length === 0) {
      // 创建新用户
      const newUser = await db.insert(users).values({
        phone,
        loginType: 'phone',
        nickname: `用户${phone.slice(-4)}`,
        lastLoginAt: new Date(),
      }).returning();
      user = newUser;
    } else {
      // 更新登录时间
      await db.update(users)
        .set({ lastLoginAt: new Date() })
        .where(eq(users.id, user[0].id));
    }

    // 记录登录
    await db.insert(loginRecords).values({
      userId: user[0].id,
      userType: 'user',
      loginTime: new Date(),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      device: request.headers.get('user-agent') || 'unknown',
    });

    // 生成JWT token
    const token = await generateToken(user[0].id);

    return NextResponse.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user[0].id,
          phone: user[0].phone,
          nickname: user[0].nickname,
          avatar: user[0].avatar,
        },
      },
    });
  } catch (error) {
    console.error('登录失败:', error);
    return NextResponse.json(
      { error: '登录失败' },
      { status: 500 }
    );
  }
}
