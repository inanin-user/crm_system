// src/types/auth.ts
import { RowDataPacket } from "mysql2";
import { LocationCode } from "./location";

export type DailySettlementRole = "admin" | "user" | 'trainer' | 'member' | 'regular-member' | 'premium-member';

// Core fields present on every account_management row, used by lightweight
// queries (login, session checks, staff dropdown, etc.)
export interface AccountRow extends RowDataPacket {
  id: number;
  username: string;
  role: DailySettlementRole;
  isActive: number;
  locations: LocationCode[];       // parsed JSON
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MemberFields extends RowDataPacket {
  memberName: string | null;
  phone: string | null;
  herbalifePCNumber: string | null;
  joinDate: string | null;
  trainerIntroducer: string | null;
  referrer: string | null;
  quota: number | null;
  renewalCount: number | null;
}

export interface TicketFields extends RowDataPacket {
  initialTickets: number | null;
  addedTickets: number | null;
  usedTickets: number | null;
}


// Extended shape for the admin management page's full account listing/detail —
// includes the member-profile fields that only that feature actually queries.
export type AccountDetailRow =
  AccountRow &
  MemberFields &
  TicketFields;