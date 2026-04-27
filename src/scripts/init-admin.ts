import bcrypt from 'bcryptjs';
import { db } from '@/db';
import { admins } from '@/db/schema';
import { eq } from 'drizzle-orm';

async function initAdmin() {
  try {
    // 生成密码hash
    const password = '123456';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    console.log('Generated password hash:', passwordHash);

    // 检查admin是否已存在
    const existingAdmin = await db.select().from(admins).where(eq(admins.username, 'admin')).limit(1);

    if (existingAdmin.length > 0) {
      console.log('Admin already exists, skipping...');
      return;
    }

    // 创建管理员
    await db.insert(admins).values({
      username: 'admin',
      password: passwordHash,
      name: '管理员',
    });

    console.log('Admin account created successfully!');
    console.log('Username: admin');
    console.log('Password: 123456');
  } catch (error) {
    console.error('Error creating admin account:', error);
    process.exit(1);
  }
}

initAdmin();
