import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, aquariums, projectVersions, loginRecords } from '@/db/schema';
import { count, sql, gt } from 'drizzle-orm';
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

export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    const auth = await verifyAdminAuth(request);
    if (!auth) {
      return NextResponse.json(
        { error: '未授权' },
        { status: 401 }
      );
    }

    // 获取用户总量
    const userCountResult = await db.select({ count: count() }).from(users);
    const totalUsers = userCountResult[0]?.count || 0;

    // 获取最近7天活跃用户数
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const activeUsersResult = await db
      .select({ count: count() })
      .from(loginRecords)
      .where(
        gt(
          sql`${loginRecords.loginTime}::timestamp`,
          sevenDaysAgo.toISOString()
        )
      );
    const activeUsers = activeUsersResult[0]?.count || 0;

    // 获取应用数（aquariums）
    const aquariumCountResult = await db.select({ count: count() }).from(aquariums);
    const totalAquariums = aquariumCountResult[0]?.count || 0;

    // 获取项目版本数
    const versionCountResult = await db.select({ count: count() }).from(projectVersions);
    const totalVersions = versionCountResult[0]?.count || 0;

    // 获取最近30天的新用户注册趋势
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const newUserTrend = await db
      .select({
        date: sql`DATE(${users.createdAt})`,
        count: count(),
      })
      .from(users)
      .where(
        gt(
          sql`${users.createdAt}::timestamp`,
          thirtyDaysAgo.toISOString()
        )
      )
      .groupBy(sql`DATE(${users.createdAt})`)
      .orderBy(sql`DATE(${users.createdAt})`);

    // 获取最近7天的登录趋势
    const loginTrend = await db
      .select({
        date: sql`DATE(${loginRecords.loginTime})`,
        count: count(),
      })
      .from(loginRecords)
      .where(
        gt(
          sql`${loginRecords.loginTime}::timestamp`,
          sevenDaysAgo.toISOString()
        )
      )
      .groupBy(sql`DATE(${loginRecords.loginTime})`)
      .orderBy(sql`DATE(${loginRecords.loginTime})`);

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        totalAquariums,
        totalVersions,
        newUserTrend,
        loginTrend,
      },
    });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    return NextResponse.json(
      { error: '获取统计数据失败' },
      { status: 500 }
    );
  }
}
