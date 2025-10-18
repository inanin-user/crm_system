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

    // 檢查是否為會員角色（包括 member, regular-member, premium-member）
    const memberRoles = ['member', 'regular-member', 'premium-member'];
    if (!member || !memberRoles.includes(member.role)) {
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
        role: member.role,
        quota: member.quota,
        initialTickets: member.initialTickets || 0,
        addedTickets: member.addedTickets || 0,
        usedTickets: member.usedTickets || 0,
        trainerIntroducer: member.trainerIntroducer,
        referrer: member.referrer,
        joinDate: member.joinDate,
        renewalCount: member.renewalCount || 0,
        herbalifePCNumber: member.herbalifePCNumber,
        locations: member.locations || [],
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