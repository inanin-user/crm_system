import { NextResponse } from 'next/server';
import { AccountDetailRow } from '@/types/auth';
import { db } from '@/lib/db';
import { ResultSetHeader } from 'mysql2';

// 迁移现有會員角色为新的會員类型
export async function POST() {
  try {

    const [memberAccounts] = await db.query<AccountDetailRow[]>(
      "SELECT * FROM account_management WHERE role = ?",
      ["member"]
    );

    // Batch update: change role to 'regular-member', backfill default values
    const [updateResult] = await db.execute<ResultSetHeader>(
      `UPDATE account_management
   SET role = ?, herbalifePCNumber = ?, joinDate = ?, trainerIntroducer = ?
   WHERE role = ?`,
      ["regular-member", "待更新", new Date(), "待指定", "member"]
    );

    console.log(`Updated ${updateResult.affectedRows} account(s) from 'member' to 'regular-member'`);

    return NextResponse.json({
      success: true,
      message: `成功将 ${updateResult.affectedRows} 个會員账户迁移為普通會員`,
      details: {
        found: memberAccounts.length,
        updated: updateResult.affectedRows
      }
    });

  } catch (error) {
    console.error('迁移會員账户失败:', error);
    return NextResponse.json(
      { success: false, message: '迁移會員账户失败', error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}