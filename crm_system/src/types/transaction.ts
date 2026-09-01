import { RowDataPacket } from "mysql2";

export interface TransactionRow extends RowDataPacket {
  id: string;
  memberId: string; // matching account_management.id
  memberName: string;
  qrCodeNumber: string;
  productDescription: string;
  region: string;
  quotaUsed: number;
  previousQuota: number;
  newQuota: number;
  transactionDate: string;
  createdAt: string;
  updatedAt: string;
}