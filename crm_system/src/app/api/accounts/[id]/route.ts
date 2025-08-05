import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Account from '@/models/Account';

// 获取单个账户的详细信息
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const account = await Account.findById(params.id);
    
    if (!account) {
      return NextResponse.json(
        { success: false, message: '账户不存在' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: {
        _id: account._id,
        username: account.username,
        password: account.displayPassword || account.password, // 显示明文密码用于管理
        role: account.role,
        isActive: account.isActive,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt,
        lastLogin: account.lastLogin
      }
    });
  } catch (error) {
    console.error('获取账户详情失败:', error);
    return NextResponse.json(
      { success: false, message: '获取账户详情失败' },
      { status: 500 }
    );
  }
} 