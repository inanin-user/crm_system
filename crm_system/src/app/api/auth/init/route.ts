import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Account from '@/models/Account';
import { db } from '@/lib/db';
import { AccountRow } from '@/types/auth';

export async function POST() {
  try {
    // 检查是否已存在管理员账号
    const [rows] = await db.query<AccountRow[]>(
          "SELECT * FROM account_management WHERE role = ?",
          ["admin"]
        );
    
    const existingAdmin = rows[0];
    
    if (existingAdmin) {
      return NextResponse.json({
        success: true,
        message: '管理员账号已存在',
        alreadyExists: true,
      });
    }

    // 创建默认管理员账号
    const adminAccount = new Account({
      username: 'admin',
      password: 'admin123', // 密码会自动加密
      role: 'admin',
      isActive: true,
    });

    await adminAccount.save();

    return NextResponse.json({
      success: true,
      message: '默认管理员账号创建成功',
      account: {
        username: 'admin',
        role: 'admin',
      },
    });
  } catch (error) {
    console.error('初始化账号错误:', error);
    return NextResponse.json(
      { success: false, message: '创建管理员账号失败' },
      { status: 500 }
    );
  }
} 