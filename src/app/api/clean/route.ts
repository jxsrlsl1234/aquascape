import { NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { materials } from '@/db/schema';

export async function POST() {
  try {
    const db = await getDb();
    await db.delete(materials);
    return NextResponse.json({ message: '已清空所有素材' });
  } catch (error) {
    console.error('Error cleaning materials:', error);
    return NextResponse.json(
      { error: 'Failed to clean materials' },
      { status: 500 }
    );
  }
}
