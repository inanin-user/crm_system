import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Account from '@/models/Account';
import { generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { username, password } = await request.json();

    // 验证输入
    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: '请提供用户名和密码' },
        { status: 400 }
      );
    }

    // 查找用户（選擇必要欄位以提升性能）
    const user = await Account.findOne({
      username: username.toLowerCase().trim(),
      isActive: true
    }).select('+password'); // 明確選擇密碼欄位

    if (!user) {
      return NextResponse.json(
        { success: false, message: '用户名或密码错误' },
        { status: 401 }
      );
    }

    // 验证密码
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, message: '用户名或密码错误' },
        { status: 401 }
      );
    }

    // 優化：只更新 lastLogin 欄位，避免整個文檔保存
    await Account.findByIdAndUpdate(user._id, {
      lastLogin: new Date()
    });

    // 生成JWT token
    const token = generateToken({
      userId: String(user._id),
      username: user.username,
      role: user.role,
    });

    // 创建响应
    const response = NextResponse.json({
      success: true,
      message: '登录成功',
      user: {
        id: String(user._id),
        username: user.username,
        role: user.role,
        locations: user.locations || [],
        lastLogin: user.lastLogin,
      },
    });

    // 設置會話 cookie（關閉瀏覽器後過期）
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      // 移除 maxAge，使其成為會話 cookie（關閉瀏覽器後過期）
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('登录错误:', error);
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    );
  }
} 