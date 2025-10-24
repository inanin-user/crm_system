import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import { getAuthUser } from '@/lib/auth';

// 獲取當前會員的交易記錄
export async function GET(request: NextRequest) {
  try {
    // 獲取當前登錄用戶
    const authUser = getAuthUser(request);
    
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: '未登錄，請先登錄' },
        { status: 401 }
      );
    }

    // 檢查用戶角色是否為會員
    const memberRoles = ['member', 'regular-member', 'premium-member'];
    if (!memberRoles.includes(authUser.role)) {
      return NextResponse.json(
        { success: false, message: '只有會員可以查看交易記錄' },
        { status: 403 }
      );
    }

    await connectDB();

    // 查詢該會員的所有交易記錄，按日期降序排列
    const transactions = await Transaction.find({
      memberId: authUser.userId
    })
      .sort({ transactionDate: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: transactions
    });

  } catch (error) {
    console.error('獲取交易記錄失敗:', error);
    return NextResponse.json(
      { success: false, message: '獲取交易記錄失敗' },
      { status: 500 }
    );
  }
}

