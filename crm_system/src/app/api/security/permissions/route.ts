import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireModule } from '@/lib/requireModule';
import { loadPermissionMap, invalidatePermissionCache } from '@/lib/permissionStore';
import { EDITABLE_ROLES, MODULES, ModuleKey, Role } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireModule(request, 'security_management');
  if (!auth.ok) return auth.response;

  const map = await loadPermissionMap();
  const matrix: Record<string, Role[]> = {};
  for (const m of MODULES) matrix[m.key] = map[m.key].filter((r) => EDITABLE_ROLES.includes(r));

  return NextResponse.json({ success: true, data: { matrix } });
}

export async function PUT(request: NextRequest) {
  const auth = await requireModule(request, 'security_management');
  if (!auth.ok) return auth.response;

  const body = await request.json();
  const matrix = body?.matrix as Record<ModuleKey, Role[]> | undefined;
  if (!matrix || typeof matrix !== 'object') {
    return NextResponse.json({ success: false, message: '資料格式錯誤' }, { status: 400 });
  }

  // write every (role, module) pair, so the table is always complete
  const values: (string | number)[][] = [];
  for (const m of MODULES) {
    const allowedRoles = Array.isArray(matrix[m.key]) ? matrix[m.key] : [];
    for (const role of EDITABLE_ROLES) {
      values.push([role, m.key, allowedRoles.includes(role) ? 1 : 0, auth.userId]);
    }
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(
      `INSERT INTO role_permissions (role, module, allowed, updatedBy) VALUES ?
       ON DUPLICATE KEY UPDATE allowed = VALUES(allowed), updatedBy = VALUES(updatedBy)`,
      [values]
    );
    await conn.commit();
    invalidatePermissionCache();
    return NextResponse.json({ success: true });
  } catch (error) {
    await conn.rollback();
    console.error('儲存權限失敗:', error);
    return NextResponse.json({ success: false, message: '儲存權限失敗' }, { status: 500 });
  } finally {
    conn.release();
  }
}