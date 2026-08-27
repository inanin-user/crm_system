// src/lib/basePath.ts
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";
export const DAILY_SETTLEMENT_PREFIX = "/daily_settlement";

export function withBasePath(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${BASE_PATH}${cleanPath}`;
}

export function withDailySettlementPath(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  if (cleanPath.startsWith("/api/")) {
    const rest = cleanPath.slice("/api/".length); // e.g. "staff" or "view-data?foo=bar"
    return withBasePath(`/api/${DAILY_SETTLEMENT_PREFIX}/${rest}`);
  }
  // Non-API paths (page routes like /home, /login) still get the folder prefix directly
  return withBasePath(`/${DAILY_SETTLEMENT_PREFIX}${cleanPath}`);
}