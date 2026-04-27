import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, loginRecords } from '@/db/schema';
import { eq } from 'drizzle-orm';
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
    const { code, userInfo } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: '微信授权码不能为空' },
        { status: 400 }
      );
    }

    // 在实际项目中，这里需要调用微信开放平台的API来换取用户信息
    // 这里为演示目的，我们模拟微信登录流程
    // 实际流程应该是：code -> access_token -> 用户信息
    // 参考文档：https://developers.weixin.qq.com/doc/oplatform/Website_App/WeChat_Login/Wechat_Login.html

    // 模拟微信OpenID和UnionID
    const mockWechatOpenId = `wx_open_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const mockWechatUnionId = `wx_union_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 查找用户
    let user = await db.select().from(users).where(eq(users.wechatOpenId, mockWechatOpenId)).limit(1);

    if (user.length === 0) {
      // 创建新用户
      const nickname = userInfo?.nickname || `微信用户${Math.floor(Math.random() * 10000)}`;
      const avatar = userInfo?.avatar || '';

      const newUser = await db.insert(users).values({
        wechatOpenId: mockWechatOpenId,
        wechatUnionId: mockWechatUnionId,
        nickname,
        avatar,
        loginType: 'wechat',
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
          nickname: user[0].nickname,
          avatar: user[0].avatar,
        },
      },
    });
  } catch (error) {
    console.error('微信登录失败:', error);
    return NextResponse.json(
      { error: '微信登录失败' },
      { status: 500 }
    );
  }
}
