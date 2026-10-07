export type Role =
  | 'admin' | 'user' | 'trainer'
  | 'member' | 'regular-member' | 'premium-member';

export type ModuleKey =
  | 'attendance' | 'attendance_admin' | 'activity_management' | 'member_management'
  | 'trainer_management' | 'financial_management' | 'account_management'
  | 'qrcode' | 'daily_settlement' | 'self_service' | 'security_management';

export const EDITABLE_ROLES: Role[] = ['trainer', 'user', 'member', 'regular-member', 'premium-member'];

export const ROLE_LABELS: Record<Role, string> = {
  admin: '管理員', trainer: '教練', user: '普通用戶',
  member: '會員', 'regular-member': '普通會員', 'premium-member': '星級會員',
};

// security_management is intentionally not listed: admin only, not editable
export const MODULES: { key: ModuleKey; label: string }[] = [
  { key: 'attendance',           label: '出席管理（運動班、點名記錄、按教練分類）' },
  { key: 'attendance_admin',     label: '出席管理（補簽到、活動管理）' },
  { key: 'activity_management',  label: '我的活動' },
  { key: 'member_management',    label: '會員管理' },
  { key: 'trainer_management',   label: '教練管理' },
  { key: 'financial_management', label: '財務管理' },
  { key: 'account_management',   label: '帳號管理' },
  { key: 'qrcode',               label: '二維碼' },
  { key: 'daily_settlement',     label: '每日結算' },
  { key: 'self_service',         label: '會員自助（掃描簽到、會員資料、記錄）' },
];

export type PermissionMap = Record<ModuleKey, Role[]>;

const MEMBER_ROLES: Role[] = ['member', 'regular-member', 'premium-member'];

// Used until the table has rows, and as the fallback if the DB read fails
export const DEFAULT_MODULE_ROLES: PermissionMap = {
  attendance:           ['trainer'],
  activity_management:  ['trainer'],
  qrcode:               ['trainer'],
  attendance_admin:     [],
  member_management:    [],
  trainer_management:   [],
  financial_management: [],
  account_management:   [],
  daily_settlement:     [],
  self_service:         MEMBER_ROLES,
  security_management:  [],
};

const ROUTE_MODULES: [string, ModuleKey][] = [
  ['/attendance/scan',                'self_service'],
  ['/member_management/my_profile',   'self_service'],
  ['/transaction_records',            'self_service'],
  ['/attendance/checkin',             'attendance_admin'],
  ['/attendance/activity_management', 'attendance_admin'],
  ['/attendance',                     'attendance'],
  ['/activity_management',            'activity_management'],
  ['/qrcode',                         'qrcode'],
  ['/member_management',              'member_management'],
  ['/trainer_management',             'trainer_management'],
  ['/financial_management',           'financial_management'],
  ['/account_management',              'account_management'],
  ['/daily_settlement',               'daily_settlement'],
  ['/security_management',            'security_management'],
];

const OPEN_PATHS = ['/', '/unauthorized'];
export const isOpenPath = (p: string) => OPEN_PATHS.includes(p);

export function canAccessModule(
  role: string | undefined,
  module: ModuleKey,
  map: PermissionMap = DEFAULT_MODULE_ROLES
): boolean {
  if (!role) return false;
  if (role === 'admin') return true;
  if (module === 'security_management') return false;
  return map[module].includes(role as Role);
}

/** Role explicitly listed (no admin bypass), for role-specific menu items */
export function isListedRole(
  role: string | undefined,
  module: ModuleKey,
  map: PermissionMap = DEFAULT_MODULE_ROLES
): boolean {
  return !!role && role !== 'admin' && map[module].includes(role as Role);
}

export function getModuleForPath(pathname: string): ModuleKey | null {
  const match = ROUTE_MODULES
    .filter(([prefix]) => pathname === prefix || pathname.startsWith(prefix + '/'))
    .sort((a, b) => b[0].length - a[0].length)[0];
  return match ? match[1] : null;
}