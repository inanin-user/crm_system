import { NextRequest, NextResponse } from 'next/server';
import { RowDataPacket } from 'mysql2';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth'; // adjust to wherever getAuthUser lives

interface PersonRow extends RowDataPacket {
  id: string;
  name: string;
  role: string;
}

interface RoleRow extends RowDataPacket {
  role: string;
}

const PERSON_ROLES = ['trainer', 'member', 'regular-member', 'premium-member'];

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ success: false, message: '未授權訪問' }, { status: 401 });
    }

    // Only admins may list everyone (the financial pages are admin-only).
    // Remove this check if other roles need the list too.
    const [me] = await db.query<RoleRow[]>(
      'SELECT role FROM account_management WHERE id = ?',
      [authUser.userId]
    );
    if (!me[0] || me[0].role !== 'admin') {
      return NextResponse.json({ success: false, message: '權限不足' }, { status: 403 });
    }

    const [rows] = await db.query<PersonRow[]>(
      `SELECT id, role,
              COALESCE(NULLIF(memberName, ''), username) AS name
       FROM account_management
       WHERE role IN (?) AND isActive = 1
       ORDER BY FIELD(role, 'trainer', 'member', 'regular-member', 'premium-member'), name`,
      [PERSON_ROLES]
    );

    return NextResponse.json({
      success: true,
      data: rows.map((r) => ({ id: r.id, name: r.name, role: r.role })),
    });
  } catch (error) {
    console.error('獲取成員列表失敗:', error);
    return NextResponse.json({ success: false, message: '獲取成員列表失敗' }, { status: 500 });
  }
}