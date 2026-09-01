import { RowDataPacket } from "mysql2";
import { LocationCode } from "./location";

export interface FinancialRecordRow extends RowDataPacket {
  id: string;
  recordType: "income" | "expense";
  memberName: string;
  item: string;
  details: string | null;
  location: LocationCode;
  unitPrice: number;
  quantity: number;
  totalAmount: number;
  recordDate: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}