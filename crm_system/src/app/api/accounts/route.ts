import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Account from '@/models/Account';

// 获取账户列表（根据角色筛选）
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    
    let query: any = { isActive: true };
    if (role) {
      query.role = role;
    }
    
    const accounts = await Account.find(query)
      .select('-password') // 不返回密码字段
      .sort({ createdAt: -1 });
    
    return NextResponse.json({
      success: true,
      data: accounts
    });
  } catch (error) {
    console.error('获取账户列表失败:', error);
    return NextResponse.json(
      { success: false, message: '获取账户列表失败' },
      { status: 500 }
    );
  }
}

// 添加新账户
export async function POST(request: NextRequest) {
  try {
    const { username, password, role } = await request.json();
    
    // 验证必填字段
    if (!username || !password || !role) {
      return NextResponse.json(
        { success: false, message: '账号名、密码和角色都是必填项' },
        { status: 400 }
      );
    }
    
    await connectDB();
    
    // 检查用户名是否已存在
    const existingAccount = await Account.findOne({ username });
    if (existingAccount) {
      return NextResponse.json(
        { success: false, message: '该账号名已存在' },
        { status: 400 }
      );
    }
    
    // 创建新账户
    const newAccount = new Account({
      username,
      password,
      displayPassword: password, // 保存明文密码用于显示
      role,
      isActive: true
    });
    
    await newAccount.save();
    
    // 返回创建的账户信息（不包含加密密码）
    const accountData = {
      _id: newAccount._id,
      username: newAccount.username,
      role: newAccount.role,
      isActive: newAccount.isActive,
      createdAt: newAccount.createdAt,
      updatedAt: newAccount.updatedAt
    };
    
    return NextResponse.json({
      success: true,
      message: '账户创建成功',
      data: accountData
    });
  } catch (error) {
    console.error('创建账户失败:', error);
    return NextResponse.json(
      { success: false, message: '创建账户失败' },
      { status: 500 }
    );
  }
} 