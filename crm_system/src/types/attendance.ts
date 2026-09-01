import { RowDataPacket } from "mysql2";

export interface AttendanceRow extends RowDataPacket {
  id: string;
  name: string;
  contactInfo: string;
  location: string;
  activity: string;
  status: string;
  activityId: string | null;
  createdAt: string;
  updatedAt: string;
}