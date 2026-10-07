import { NextRequest, NextResponse } from 'next/server';
import { RowDataPacket } from 'mysql2';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth'; // wherever yours lives
import { canAccessModule, ModuleKey } from '@/lib/permissions';

interface RoleRow extends RowDataPacket { role: string }

export async function requireModule(request: NextRequest, module: ModuleKey) {
  const authUser = getAuthUser(request);
  if (!authUser) {
    return { ok: false as const, response: NextResponse.json({ success: false, message: '未授權訪問' }, { status: 401 }) };
  }

  // Read the role from the DB, so a role change takes effect immediately
  const [rows] = await db.query<RoleRow[]>(
    'SELECT role FROM account_management WHERE id = ? AND isActive = 1',
    [authUser.userId]
  );
  const role = rows[0]?.role;

  if (!canAccessModule(role, module)) {
    return { ok: false as const, response: NextResponse.json({ success: false, message: '權限不足' }, { status: 403 }) };
  }
  return { ok: true as const, userId: authUser.userId, role: role! };
}