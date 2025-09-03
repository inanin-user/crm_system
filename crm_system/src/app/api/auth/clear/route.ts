import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // 創建響應
    const response = NextResponse.json({
      success: true,
      message: '認證狀態已清理'
    });

    // 強制清除 auth_token cookie
    response.cookies.set('auth_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // 立即過期
      path: '/',
    });

    // 額外的清理措施 - 設置多種可能的 cookie 路徑
    response.cookies.set('auth_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/api',
    });

    return response;
  } catch (error) {
    console.error('清理認證狀態錯誤:', error);
    return NextResponse.json(
      { success: false, message: '清理失敗' },
      { status: 500 }
    );
  }
}