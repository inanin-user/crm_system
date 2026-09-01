import { RowDataPacket } from "mysql2";
import { LocationCode } from "./location";

export interface ActivityRow extends RowDataPacket {
  id: string;
  activityName: string;
  trainerId: string;
  trainerName: string;
  startTime: string;
  endTime: string;
  duration: number | null;
  participants: string[]; // JSON stored as longtext — needs manual parsing, see below
  location: LocationCode;
  description: string | null;
  isActive: number; // tinyint(1) — 0 or 1
  createdAt: string;
  updatedAt: string;
}
