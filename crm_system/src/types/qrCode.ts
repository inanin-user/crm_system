import { RowDataPacket } from "mysql2";
import { LocationCode } from "./location";
import { db } from "@/lib/db";

export interface qrCodeRow extends RowDataPacket {
  id: string;                 // UUID
  qrCodeNumber: string;       // CHAR(5)
  regionCode: LocationCode;
  regionName: LocationCode;
  productDescription: string;
  price: number;
  qrCodeData: string;
  qrCodeImage?: string | null;
  createdBy: string;          // UUID FK
  isActive: boolean;
  createdAt: string;          // DATETIME
  updatedAt: string;          // DATETIME
}

export async function getNextSequence(name: string): Promise<number> {
  // 1. 先嘗試更新 seq + 1
  await db.query(
    `
    INSERT INTO counters (id, seq, createdAt, updatedAt)
    VALUES (?, 1, NOW(), NOW())
    ON DUPLICATE KEY UPDATE
      seq = seq + 1,
      updatedAt = NOW();
    `,
    [name]
  );

  // 2. 讀取最新 seq
  const [rows] = await db.query<qrCodeRow[]>(
    `SELECT seq FROM counters WHERE id = ? LIMIT 1`,
    [name]
  );

  let seq = rows[0].seq;

  // 3. 超過 99999 → 重置為 1
  if (seq > 99999) {
    await db.query(
      `UPDATE counters SET seq = 1, updatedAt = NOW() WHERE id = ?`,
      [name]
    );
    seq = 1;
  }

  return seq;
}

export async function getCurrentSequence(name: string): Promise<number> {
  const [rows] = await db.query<qrCodeRow[]>(
    `SELECT seq FROM counters WHERE id = ? LIMIT 1`,
    [name]
  );

  return rows[0].seq;
}

export function padQRCodeNumber(num: number): string {
  if (num < 10000) {
    return num.toString().padStart(4, '0');   // 0001–9999
  }
  return num.toString();                      // 10000–99999
}