import { NextRequest, NextResponse } from 'next/server';
import { RowDataPacket } from 'mysql2';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { loadPermissionMap } from '@/lib/permissionStore';
import { MODULES, ModuleKey, canAccessModule, isListedRole } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authUser = getAuthUser(request);
  if (!authUser) return NextResponse.json({ success: false, message: '未授權訪問' }, { status: 401 });

  const [rows] = await db.query<(RowDataPacket & { role: string })[]>(
    'SELECT role FROM account_management WHERE id = ? AND isActive = 1',
    [authUser.userId]
  );
  const role = rows[0]?.role;
  if (!role) return NextResponse.json({ success: false, message: '未授權訪問' }, { status: 401 });

  const map = await loadPermissionMap();
  const keys: ModuleKey[] = [...MODULES.map((m) => m.key), 'security_management'];

  return NextResponse.json({
    success: true,
    data: {
      role,
      modules: keys.filter((k) => canAccessModule(role, k, map)),
      listed: keys.filter((k) => isListedRole(role, k, map)),
    },
  });
}