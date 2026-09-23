// app/api/view-data/route.ts
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { db } from "@/lib/db";

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
    let settlementRows: any[];

    if (role === "admin") {
      const [rows] = await db.query(
        `SELECT username, submitted_at, center, doc_date, doc_time, grand_total, remarks
         FROM settlements
         WHERE doc_date BETWEEN ? AND ?
         ORDER BY submitted_at DESC`,
        [dateFrom, dateTo]
      );
      settlementRows = rows as any[];
    } else {
      // Non-admin: restrict to locations on their account
      const [accountRows] = await db.query(
        "SELECT locations FROM account_management WHERE username = ? AND isActive = 1",
        [username]
      );
      const rawLocations = (accountRows as any[])[0]?.locations;
      let locations: string[] = [];
      if (Array.isArray(rawLocations)) {
        locations = rawLocations.map(String).filter(Boolean);
      } else if (typeof rawLocations === "string" && rawLocations.trim()) {
        try {
          const parsed = JSON.parse(rawLocations);
          locations = Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [rawLocations];
        } catch {
          locations = [rawLocations];
        }
      }

      if (locations.length === 0) {
        return NextResponse.json({ error: "找不到所屬分店" }, { status: 403 });
      }

      const locPlaceholders = locations.map(() => "?").join(", ");
      const [rows] = await db.query(
        `SELECT username, submitted_at, center, doc_date, doc_time, grand_total, remarks
         FROM settlements
         WHERE center IN (${locPlaceholders}) AND doc_date BETWEEN ? AND ?
         ORDER BY submitted_at DESC`,
        [...locations, dateFrom, dateTo]
      );
      settlementRows = rows as any[];
    }

    if (settlementRows.length === 0) {
      return NextResponse.json({ records: [] });
    }

    // Fetch related items/income for exactly the (username, submitted_at) pairs found above
    const keys = settlementRows.map((r) => [r.username, r.submitted_at]);
    const placeholders = keys.map(() => "(?, ?)").join(", ");
    const flatParams = keys.flat();
    
    const [itemRows] = await db.query(
      `SELECT username, submitted_at, section_type, staff_name, quantity, income_type, amount
       FROM settlement_items
       WHERE (username, submitted_at) IN (${placeholders})`,
      flatParams
    );

    const [incomeRows] = await db.query(
      `SELECT username, submitted_at, income_type, quantity, amount, staff_name
       FROM settlement_income
       WHERE (username, submitted_at) IN (${placeholders})`,
      flatParams
    );

    // Group items/income by their parent (username, submitted_at)
    const keyOf = (u: string, t: any) => `${u}__${new Date(t).toISOString()}`;

    const itemsByKey: Record<string, any[]> = {};
    for (const item of itemRows as any[]) {
      const key = keyOf(item.username, item.submitted_at);
      (itemsByKey[key] ||= []).push(item);
    }

    const incomeByKey: Record<string, any[]> = {};
    for (const inc of incomeRows as any[]) {
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
        income: (() => {
          const rows = incomeByKey[key] || [];
          const filled = rows.filter(
            (r) => r.staff_name || Number(r.amount) || Number(r.quantity)
          );
          if (filled.length) return filled;
          return items
            .filter((i) => i.section_type === "introductionFee")
            .map((i) => ({
              income_type: i.income_type || "試",
              quantity: i.quantity,
              amount: i.amount,
              staff_name: i.staff_name,
            }));
        })(),
      };
    });

    return NextResponse.json({ records });
  } catch (err) {
    console.error("view-data route error:", err);
    return NextResponse.json({ error: "無法取得結算資料" }, { status: 500 });
  }
}