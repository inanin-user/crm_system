// app/api/update-data/route.ts
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { db } from "@/lib/db";
import { SettlementRow, SettlementItemRow, SettlementIncomeRow, StaffDiffRow, IncomeDiffRow } from "@/types/settlement";
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function POST(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "未登入" }, { status: 401 });
  }

  let username: string;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    username = payload.username as string;
    if (!username) throw new Error("token missing username");
  } catch {
    return NextResponse.json({ error: "登入已過期，請重新登入" }, { status: 401 });
  }

  const body = await req.json();
  const {
    center,
    docDate,
    docTime,
    grandTotal,
    remarks,
    waterbar = [],
    classItems = [],
    introductionFee = [],
    income = [],
  } = body;
  
  if (!center || !docDate || !docTime) {
    return NextResponse.json({ error: "缺少必要欄位" }, { status: 400 });
  }

  const submittedAt = new Date(); // part of the composite primary key

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    await conn.execute(
      `INSERT INTO settlements (username, submitted_at, center, doc_date, doc_time, grand_total, remarks)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [username, submittedAt, center, docDate, docTime, grandTotal || 0, remarks || null]
    );

    const insertItems = async (
      sectionType: string,
      rows: { staffName: string; quantity: number }[]
    ) => {
      for (const row of rows) {
        if (!row.staffName) continue;
        await conn.execute(
          `INSERT INTO settlement_items (username, submitted_at, section_type, staff_name, quantity)
           VALUES (?, ?, ?, ?, ?)`,
          [username, submittedAt, sectionType, row.staffName, row.quantity || 0]
        );
      }
    };

    await insertItems("waterbar", waterbar);
    await insertItems("class", classItems);
    await insertItems("introductionFee", introductionFee);

    for (const row of income) {
      if (!row.incomeType) continue;
      await conn.execute(
        `INSERT INTO settlement_income (username, submitted_at, income_type, quantity, amount)
         VALUES (?, ?, ?, ?, ?)`,
        [username, submittedAt, row.incomeType, row.quantity || 0, row.amount || 0]
      );
    }

    await conn.commit();
    return NextResponse.json({ success: true, submittedAt });
  } catch (err) {
    await conn.rollback();
    console.error("update-data error:", err);
    return NextResponse.json({ error: "儲存失敗，請稍後再試" }, { status: 500 });
  } finally {
    conn.release();
  }
}

export async function PUT(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) return NextResponse.json({ error: "未登入" }, { status: 401 });

  let editor: string;
  let role: string;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    editor = payload.username as string;
    role = payload.role as string;
  } catch {
    return NextResponse.json({ error: "登入已過期" }, { status: 401 });
  }

  if (role !== "admin") {
    return NextResponse.json({ error: "權限不足" }, { status: 403 });
  }

  const body = await req.json();
  const {
    username,
    submittedAt,
    center,
    grandTotal,
    remarks,
    waterbar = [],
    classItems = [],
    introductionFee = [],
    income = [],
  } = body;

  if (!username || !submittedAt) {
    return NextResponse.json({ error: "缺少記錄識別碼" }, { status: 400 });
  }

  const normStaffRows = (rows: any[]) =>
    rows
      .filter((r) => r.staffName)
      .map((r) => ({ staffName: r.staffName, quantity: Number(r.quantity) || 0 }));

  const normIncomeRows = (rows: any[]) =>
    rows
      .filter((r) => r.incomeType)
      .map((r) => ({
        incomeType: r.incomeType,
        quantity: Number(r.quantity) || 0,
        amount: Number(r.amount) || 0,
      }));

  const newWaterbar = normStaffRows(waterbar);
  const newClassItems = normStaffRows(classItems);
  const newIntroductionFee = normStaffRows(introductionFee);
  const newIncome = normIncomeRows(income);

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [existingRows] = await conn.query<SettlementRow[]>(
  `SELECT center, doc_date, doc_time, grand_total, remarks
   FROM settlements WHERE username = ? AND submitted_at = ? FOR UPDATE`,
  [username, submittedAt]
);
const existing = existingRows[0]; // was: (existingRows as any[])[0]

    if (!existing) {
      await conn.rollback();
      return NextResponse.json({ error: "找不到記錄" }, { status: 404 });
    }

    
const [existingItemRows] = await conn.query<SettlementItemRow[]>(
  `SELECT section_type, staff_name, quantity FROM settlement_items
   WHERE username = ? AND submitted_at = ?`,
  [username, submittedAt]
);
const [existingIncomeRows] = await conn.query<SettlementIncomeRow[]>(
  `SELECT income_type, quantity, amount FROM settlement_income
   WHERE username = ? AND submitted_at = ?`,
  [username, submittedAt]
);

const existingItems = existingItemRows;
    const oldWaterbar = normStaffRows(
      existingItems.filter((i) => i.section_type === "waterbar")
        .map((i) => ({ staffName: i.staff_name, quantity: i.quantity }))
    );
    const oldClassItems = normStaffRows(
      existingItems.filter((i) => i.section_type === "class")
        .map((i) => ({ staffName: i.staff_name, quantity: i.quantity }))
    );
    const oldIntroductionFee = normStaffRows(
      existingItems.filter((i) => i.section_type === "introductionFee")
        .map((i) => ({ staffName: i.staff_name, quantity: i.quantity }))
    );
    const oldIncome = normIncomeRows(
      (existingIncomeRows as any[]).map((i) => ({
        incomeType: i.income_type,
        quantity: i.quantity,
        amount: i.amount,
      }))
    );

    // Build diff list: [fieldName, previousValue, updatedValue]
    const diffs: { field: string; prev: string; updated: string }[] = [];

    const compareScalar = (field: string, prev: string | number, updated: string | number) => {
  if (String(prev) !== String(updated)) {
    diffs.push({ field, prev: String(prev), updated: String(updated) });
  }
};

    // Matches items between two arrays by deep equality, returns what's uniquely
    // added in `newArr` and what's uniquely removed from `oldArr` — robust even if
    // rows were reordered, not just appended/removed at the end.
    const diffMultiset = (oldArr: any[], newArr: any[]) => {
      const oldPool = [...oldArr];
      const added: any[] = [];
      for (const item of newArr) {
        const idx = oldPool.findIndex((o) => JSON.stringify(o) === JSON.stringify(item));
        if (idx === -1) added.push(item);
        else oldPool.splice(idx, 1);
      }
      const removed = oldPool; // leftover old items with no match in newArr
      return { added, removed };
    }

    const compareArrayField = (
      field: string,
      oldArr: any[],
      newArr: any[],
      diffs: { field: string; prev: StaffDiffRow[]| IncomeDiffRow[]; updated: StaffDiffRow[]| IncomeDiffRow[] }[]
    ) => {
      const oldStr = JSON.stringify(oldArr);
      const newStr = JSON.stringify(newArr);

      const prevStr = JSON.stringify(prev);
      const updatedStr = JSON.stringify(updated);
      if (oldStr === newStr) return;

      if (oldArr.length !== newArr.length) {
        const { added, removed } = diffMultiset(oldArr, newArr);
        if (added.length > 0) {
          diffs.push({
            field: `${field}_added`,
            prev: "",
            updated: updatedStr,
          });
        }
        if (removed.length > 0) {
          diffs.push({
            field: `${field}_removed`,
            prev: prevStr,
            updated: "",
          });
        }
      } else {
        // Same row count — pure field edits, keep the existing whole-array format
        diffs.push({ field, prev: oldStr, updated: newStr });
      }
    }

    compareScalar("center", existing.center, center);
    compareScalar("grandTotal", Number(existing.grand_total), Number(grandTotal) || 0);
    compareScalar("remarks", existing.remarks || "", remarks || "");
    compareArrayField("waterbar", oldWaterbar, newWaterbar, diffs);
    compareArrayField("classItems", oldClassItems, newClassItems, diffs);
    compareArrayField("introductionFee", oldIntroductionFee, newIntroductionFee, diffs);
    compareArrayField("income", oldIncome, newIncome, diffs);

    if (diffs.length === 0) {
      await conn.rollback();
      return NextResponse.json({ success: true, changed: false });
    }

    // Apply updates
    await conn.execute(
      `UPDATE settlements SET center = ?, doc_date = ?, doc_time = ?, grand_total = ?, remarks = ?
      WHERE username = ? AND submitted_at = ?`,
      [center, existing.doc_date, existing.doc_time, grandTotal || 0, remarks || null, username, submittedAt]
    );

    await conn.execute(
      `DELETE FROM settlement_items WHERE username = ? AND submitted_at = ?`,
      [username, submittedAt]
    );
    const insertItems = async (sectionType: string, rows: { staffName: string; quantity: number }[]) => {
      for (const row of rows) {
        await conn.execute(
          `INSERT INTO settlement_items (username, submitted_at, section_type, staff_name, quantity)
           VALUES (?, ?, ?, ?, ?)`,
          [username, submittedAt, sectionType, row.staffName, row.quantity]
        );
      }
    };
    await insertItems("waterbar", newWaterbar);
    await insertItems("class", newClassItems);
    await insertItems("introductionFee", newIntroductionFee);

    await conn.execute(
      `DELETE FROM settlement_income WHERE username = ? AND submitted_at = ?`,
      [username, submittedAt]
    );
    for (const row of newIncome) {
      await conn.execute(
        `INSERT INTO settlement_income (username, submitted_at, income_type, quantity, amount)
         VALUES (?, ?, ?, ?, ?)`,
        [username, submittedAt, row.incomeType, row.quantity, row.amount]
      );
    }

    // Write history rows
    for (const d of diffs) {
      await conn.execute(
        `INSERT INTO modify_history (settlement_username, settlement_submitted_at, modified_by, field_name, previous_value, updated_value)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [username, submittedAt, editor, d.field, d.prev, d.updated]
      );
    }

    await conn.commit();
    return NextResponse.json({ success: true, changed: true, changedFields: diffs.map((d) => d.field) });
  } catch (err) {
    await conn.rollback();
    console.error("update-data PUT error:", err);
    return NextResponse.json({ error: "更新失敗，請稍後再試" }, { status: 500 });
  } finally {
    conn.release();
  }
}