import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

// 简单的内存存储验证码（生产环境应使用Redis）
const verificationCodes = new Map<string, { code: string; expiry: number }>();

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();

    // 验证手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { error: '手机号格式不正确' },
        { status: 400 }
      );
    }

    // 生成6位验证码
    const code = randomBytes(3).toString('hex').slice(0, 6).toUpperCase();

    // 存储验证码，5分钟有效期
    verificationCodes.set(phone, {
      code,
      expiry: Date.now() + 5 * 60 * 1000,
    });

    // 清理过期的验证码
    const now = Date.now();
    for (const [key, value] of verificationCodes.entries()) {
      if (value.expiry < now) {
        verificationCodes.delete(key);
      }
    }

    // 在实际项目中，这里应该调用短信服务发送验证码
    console.log(`验证码已发送到 ${phone}: ${code}`);

    // 为了演示，返回验证码（生产环境中不要返回）
    return NextResponse.json({
      success: true,
      message: '验证码已发送',
      // 仅用于演示，生产环境应删除
      code: process.env.NODE_ENV === 'development' ? code : undefined,
    });
  } catch (error) {
    console.error('发送验证码失败:', error);
    return NextResponse.json(
      { error: '发送验证码失败' },
      { status: 500 }
    );
  }
}

// 导出验证码验证函数供其他API使用
export function verifyCode(phone: string, code: string): boolean {
  const record = verificationCodes.get(phone);
  if (!record) {
    return false;
  }
  if (record.expiry < Date.now()) {
    verificationCodes.delete(phone);
    return false;
  }
  if (record.code !== code) {
    return false;
  }
  // 验证成功后删除验证码
  verificationCodes.delete(phone);
  return true;
}
