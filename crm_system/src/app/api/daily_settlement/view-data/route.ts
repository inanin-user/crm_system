// app/api/view-data/route.ts
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { db } from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { SettlementIncomeRow, SettlementItemRow, SettlementRow } from "@/types/settlement";
import { LocationCode } from "@/types/location";

interface StaffCenterRow extends RowDataPacket {
  locations: LocationCode[];
}

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
const MAX_RANGE_DAYS = 62; // ~2 months

export async function GET(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "未登入" }, { status: 401 });
  }

  let username: string;
  let role: string;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    username = payload.username as string;
    role = payload.role as string;
    if (!username || !role) throw new Error("invalid payload");
  } catch {
    return NextResponse.json({ error: "登入已過期" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  if (!dateFrom || !dateTo) {
    return NextResponse.json({ error: "請提供日期範圍" }, { status: 400 });
  }

  const fromDate = new Date(dateFrom);
  const toDate = new Date(dateTo);
  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime()) || fromDate > toDate) {
    return NextResponse.json({ error: "日期範圍無效" }, { status: 400 });
  }

  const rangeDays = (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24);
  if (rangeDays > MAX_RANGE_DAYS) {
    return NextResponse.json({ error: "篩選範圍最長為 2 個月" }, { status: 400 });
  }

  try {
    let settlementRows: SettlementRow[];

    if (role === "admin") {
      const [rows] = await db.query<SettlementRow[]>(
        `SELECT username, submitted_at, center, doc_date, doc_time, grand_total, remarks
         FROM settlements
         WHERE doc_date BETWEEN ? AND ?
         ORDER BY submitted_at DESC`,
        [dateFrom, dateTo]
      );
      settlementRows = rows;
    } else {
      // Non-admin: restrict to their own center
      const [staffRows] = await db.query<StaffCenterRow[]>(
        "SELECT locations FROM account_management WHERE username = ?",
        [username]
      );
      const staffCenter = staffRows[0].locations[0];

      if (!staffCenter) {
        return NextResponse.json({ error: "找不到所屬分店" }, { status: 403 });
      }

      const [rows] = await db.query<SettlementRow[]>(
        `SELECT username, submitted_at, center, doc_date, doc_time, grand_total, remarks
         FROM settlements
         WHERE center = ? AND doc_date BETWEEN ? AND ?
         ORDER BY submitted_at DESC`,
        [staffCenter, dateFrom, dateTo]
      );
      settlementRows = rows;
    }

    if (settlementRows.length === 0) {
      return NextResponse.json({ records: [] });
    }

    // Fetch related items/income for exactly the (username, submitted_at) pairs found above
    const keys = settlementRows.map((r) => [r.username, r.submitted_at]);
    const placeholders = keys.map(() => "(?, ?)").join(", ");
    const flatParams = keys.flat();

    const [itemRows] = await db.query<SettlementItemRow[]>(
      `SELECT username, submitted_at, section_type, staff_name, quantity
       FROM settlement_items
       WHERE (username, submitted_at) IN (${placeholders})`,
      flatParams
    );

    const [incomeRows] = await db.query<SettlementIncomeRow[]>(
      `SELECT username, submitted_at, income_type, quantity, amount
       FROM settlement_income
       WHERE (username, submitted_at) IN (${placeholders})`,
      flatParams
    );

    // Group items/income by their parent (username, submitted_at)
    const keyOf = (u: string, t: string) => `${u}__${new Date(t).toISOString()}`;

    const itemsByKey: Record<string, SettlementItemRow[]> = {};
    for (const item of itemRows) {
      const key = keyOf(item.username, item.submitted_at);
      (itemsByKey[key] ||= []).push(item);
    }

    const incomeByKey: Record<string, SettlementIncomeRow[]> = {};
    for (const inc of incomeRows) {
      const key = keyOf(inc.username, inc.submitted_at);
      (incomeByKey[key] ||= []).push(inc);
    }

    const records = settlementRows.map((s) => {
      const key = keyOf(s.username, s.submitted_at);
      const items = itemsByKey[key] || [];
      return {
        username: s.username,
        submittedAt: s.submitted_at,
        center: s.center,
        docDate: s.doc_date,
        docTime: s.doc_time,
        grandTotal: Number(s.grand_total),
        remarks: s.remarks,
        waterbar: items.filter((i) => i.section_type === "waterbar"),
        classItems: items.filter((i) => i.section_type === "class"),
        introductionFee: items.filter((i) => i.section_type === "introductionFee"),
        income: incomeByKey[key] || [],
      };
    });

    return NextResponse.json({ records });
  } catch (err) {
    console.error("view-data route error:", err);
    return NextResponse.json({ error: "無法取得結算資料" }, { status: 500 });
  }
}