import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { TransactionRow } from '@/types/transaction';
import { db } from '@/lib/db';

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

    const [transactions] = await db.query<TransactionRow[]>(
      `SELECT *
      FROM transactions
      WHERE memberId = ?
      ORDER BY transactionDate DESC`,
      [authUser.userId]
    );

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

