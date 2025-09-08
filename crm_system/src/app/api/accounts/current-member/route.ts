import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Account from '@/models/Account';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // 驗證用戶身份
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({
        success: false,
        message: '未授權訪問'
      }, { status: 401 });
    }

    // 根據用戶ID查找會員資料
    const member = await Account.findById(authUser.userId);

    if (!member || member.role !== 'member') {
      return NextResponse.json({
        success: false,
        message: '找不到會員資料或權限不足'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        _id: member._id,
        username: member.username,
        memberName: member.memberName,
        phone: member.phone,
        email: member.email,
        quota: member.quota,
        isActive: member.isActive
      },
      message: '會員資料獲取成功'
    });

  } catch (error: unknown) {
    console.error('獲取會員資料失敗:', error);
    return NextResponse.json({
      success: false,
      message: '獲取會員資料時出錯',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 });
  }
}