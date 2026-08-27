// app/api/settlement/route.ts
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { db } from "@/lib/db";
import { SettlementRow, SettlementItemRow, SettlementIncomeRow } from "@/types/settlement";
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function GET(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) return NextResponse.json({ error: "未登入" }, { status: 401 });

  let role: string;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    role = payload.role as string;
  } catch {
    return NextResponse.json({ error: "登入已過期" }, { status: 401 });
  }

  if (role !== "admin") {
    return NextResponse.json({ error: "權限不足" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username");
  const submittedAt = searchParams.get("submittedAt");
  if (!username || !submittedAt) {
    return NextResponse.json({ error: "缺少參數" }, { status: 400 });
  }

  try {
    const [settlementRows] = await db.query<SettlementRow[]>(
      `SELECT username, submitted_at, center, doc_date, doc_time, grand_total, remarks
      FROM settlements WHERE username = ? AND submitted_at = ?`,
      [username, submittedAt]
    );
    const settlement = settlementRows[0];
    if (!settlement) {
      return NextResponse.json({ error: "找不到記錄" }, { status: 404 });
    }

    const [itemRows] = await db.query<SettlementItemRow[]>(
      `SELECT section_type, staff_name, quantity FROM settlement_items
      WHERE username = ? AND submitted_at = ?`,
      [username, submittedAt]
    );
    const [incomeRows] = await db.query<SettlementIncomeRow[]>(
      `SELECT income_type, quantity, amount FROM settlement_income
      WHERE username = ? AND submitted_at = ?`,
      [username, submittedAt]
    );

    const items = itemRows; // was: itemRows as any[]
    const income = incomeRows;

    return NextResponse.json({
      username: settlement.username,
      submittedAt: settlement.submitted_at,
      center: settlement.center,
      docDate: settlement.doc_date,
      docTime: settlement.doc_time,
      grandTotal: Number(settlement.grand_total),
      remarks: settlement.remarks || "",
      waterbar: items.filter((i) => i.section_type === "waterbar")
        .map((i) => ({ staffName: i.staff_name, quantity: i.quantity })),
      classItems: items.filter((i) => i.section_type === "class")
        .map((i) => ({ staffName: i.staff_name, quantity: i.quantity })),
      introductionFee: items.filter((i) => i.section_type === "introductionFee")
        .map((i) => ({ staffName: i.staff_name, quantity: i.quantity })),
      income: income.map((i) => ({
        incomeType: i.income_type,
        quantity: i.quantity,
        amount: Number(i.amount),
      })),
    });
  } catch (err) {
    console.error("settlement route error:", err);
    return NextResponse.json({ error: "無法取得記錄" }, { status: 500 });
  }
}