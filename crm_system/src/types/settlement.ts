// src/types/settlement.ts
import { RowDataPacket } from "mysql2";

export interface SettlementRow extends RowDataPacket {
  username: string;
  submitted_at: string;
  center: string;
  doc_date: string;
  doc_time: string;
  grand_total: number;
  remarks: string | null;
}

export interface SettlementItemRow extends RowDataPacket {
  username: string;
  submitted_at: string;
  section_type: "waterbar" | "class" | "introductionFee";
  staff_name: string;
  quantity: number;
}

export interface SettlementIncomeRow extends RowDataPacket {
  username: string;
  submitted_at: string;
  income_type: string;
  quantity: number;
  amount: number;
}

export interface StaffRow extends RowDataPacket {
  center: string;
}

export type StaffDiffRow = { staffName: string; quantity: number };
export type IncomeDiffRow = { incomeType: string; quantity: number; amount: number };