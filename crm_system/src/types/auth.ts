// src/types/auth.ts
import { RowDataPacket } from "mysql2";

export interface AccountRow extends RowDataPacket {
  id: number;
  username: string;
  password: string;
  role: string;
  isActive: number;
  lastLogin: string | null;
}