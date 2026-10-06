import { RowDataPacket } from "mysql2";
import { LocationCode } from "./location";
import { db } from "@/lib/db";
import { padQRCodeNumber } from "@/lib/qrcodeNumber";

export { padQRCodeNumber }; // keeps existing imports working

export interface qrCodeRow extends RowDataPacket {
  id: string;
  qrCodeNumber: string;       // e.g. "0007_WC"
  regionCode: LocationCode;
  regionName: LocationCode;
  productDescription: string;
  price: number;
  qrCodeData: string;
  qrCodeImage?: string | null;
  createdBy: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CounterRow extends RowDataPacket {
  seq: number;
}

const MAX_SEQ = 99999;

/**
 * Atomically takes the next number for one counter (e.g. "qrcode_number_WC").
 * Increment and wrap-around happen in a single UPDATE on one connection, so two
 * admins generating at the same moment can't get the same number.
 */
export async function getNextSequence(name: string): Promise<number> {
  const conn = await db.getConnection();
  try {
    // make sure the row exists (first use of a region)
    await conn.query(
      `INSERT INTO counters (id, seq, createdAt, updatedAt)
       VALUES (?, 0, NOW(), NOW())
       ON DUPLICATE KEY UPDATE id = id`,
      [name]
    );

    // increment, wrap after 99999, and remember the value on this connection
    await conn.query(
      `UPDATE counters
       SET seq = LAST_INSERT_ID(IF(seq >= ?, 1, seq + 1)),
           updatedAt = NOW()
       WHERE id = ?`,
      [MAX_SEQ, name]
    );

    const [rows] = await conn.query<CounterRow[]>(`SELECT LAST_INSERT_ID() AS seq`);
    return Number(rows[0].seq);
  } finally {
    conn.release();
  }
}

/** Last number handed out for this counter (0 if the region has never been used). */
export async function getCurrentSequence(name: string): Promise<number> {
  const [rows] = await db.query<CounterRow[]>(
    `SELECT seq FROM counters WHERE id = ? LIMIT 1`,
    [name]
  );
  return rows[0]?.seq ?? 0;
}

/** The number the next generate in this region will receive (preview only). */
export async function peekNextSequence(name: string): Promise<number> {
  const current = await getCurrentSequence(name);
  return current >= MAX_SEQ ? 1 : current + 1;
}