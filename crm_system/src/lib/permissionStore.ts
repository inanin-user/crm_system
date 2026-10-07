import { RowDataPacket } from 'mysql2';
import { db } from '@/lib/db';
import { DEFAULT_MODULE_ROLES, PermissionMap, ModuleKey, Role } from '@/lib/permissions';

interface PermRow extends RowDataPacket { role: Role; module: ModuleKey; allowed: number }

let cache: { map: PermissionMap; at: number } | null = null;
const TTL = 30_000;

export function invalidatePermissionCache() { cache = null; }

export async function loadPermissionMap(): Promise<PermissionMap> {
  if (cache && Date.now() - cache.at < TTL) return cache.map;

  const map = {} as PermissionMap;
  for (const k of Object.keys(DEFAULT_MODULE_ROLES) as ModuleKey[]) {
    map[k] = [...DEFAULT_MODULE_ROLES[k]];
  }

  try {
    const [rows] = await db.query<PermRow[]>('SELECT role, module, allowed FROM role_permissions');
    for (const r of rows) {
      if (!map[r.module] || r.module === 'security_management') continue;
      const list = map[r.module].filter((x) => x !== r.role);
      if (r.allowed) list.push(r.role);
      map[r.module] = list;
    }
  } catch (e) {
    console.error('讀取權限失敗，使用預設值:', e);
  }

  cache = { map, at: Date.now() };
  return map;
}