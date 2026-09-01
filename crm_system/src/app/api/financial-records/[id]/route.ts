import { NextRequest, NextResponse } from 'next/server';
import { FinancialRecordRow } from '@/types/financialRecord';
import { db } from '@/lib/db';

// 修改財務記錄
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const body = await request.json();

    const {
      recordType,
      memberName,
      item,
      details,
      location,
      unitPrice,
      quantity,
      recordDate
    } = body;

    // 驗證必填字段
    if (!recordType || !memberName || !item || !location || unitPrice === undefined || !quantity) {
      console.log('必填字段驗證失敗');
      return NextResponse.json(
        { success: false, message: '請填寫所有必填字段' },
        { status: 400 }
      );
    }

    // 驗證數值
    if (unitPrice < 0 || quantity < 1) {
      console.log('數值驗證失敗:', { unitPrice, quantity });
      return NextResponse.json(
        { success: false, message: '單價和數量必須為正數' },
        { status: 400 }
      );
    }

    // Step 1 — Build dynamic update fields
    const updateFields: string[] = [];
    const updateValues: (string | number | null)[] = [];

    if (recordType !== undefined) {
      updateFields.push("recordType = ?");
      updateValues.push(recordType);
    }
    if (memberName !== undefined) {
      updateFields.push("memberName = ?");
      updateValues.push(memberName.trim());
    }
    if (item !== undefined) {
      updateFields.push("item = ?");
      updateValues.push(item.trim());
    }
    if (details !== undefined) {
      updateFields.push("details = ?");
      updateValues.push(details?.trim() ?? null);
    }
    if (location !== undefined) {
      updateFields.push("location = ?");
      updateValues.push(location.trim());
    }
    if (unitPrice !== undefined) {
      updateFields.push("unitPrice = ?");
      updateValues.push(unitPrice);
    }
    if (quantity !== undefined) {
      updateFields.push("quantity = ?");
      updateValues.push(quantity);
    }
    if (recordDate !== undefined) {
      updateFields.push("recordDate = ?");
      const formattedDate = (recordDate ? new Date(recordDate) : new Date())
        .toISOString()
        .slice(0, 19) // "YYYY-MM-DDTHH:mm:ss"
        .replace("T", " "); // "YYYY-MM-DD HH:mm:ss"
      updateValues.push(formattedDate);
    }

    // Always recalc totalAmount
    updateFields.push("totalAmount = unitPrice * quantity");

    // Always update timestamp
    updateFields.push("updatedAt = NOW()");

    // Step 2 — Execute UPDATE
    const sqlUpdate = `
  UPDATE financial_records
  SET ${updateFields.join(", ")}
  WHERE id = ?
`;

    updateValues.push(id.trim());

    await db.query(sqlUpdate, updateValues);

    // Step 3 — Fetch updated row
    const [rows] = await db.query<FinancialRecordRow[]>(
      "SELECT * FROM financial_records WHERE id = ?",
      [id.trim()]
    );

    const updatedRecord = rows[0];

    if (!updatedRecord) {
      return NextResponse.json(
        { success: false, message: '財務記錄不存在' },
        { status: 404 }
      );
    }

    console.log('記錄更新成功:', updatedRecord.id);

    return NextResponse.json({
      success: true,
      message: '財務記錄修改成功',
      data: updatedRecord
    });
  } catch (error) {
    console.error('財務記錄修改失敗:', error);
    const errorMessage = error instanceof Error ? error.message : '未知錯誤';
    return NextResponse.json(
      { success: false, message: `財務記錄修改失敗: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// 刪除財務記錄
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;


    // Step 1 — Fetch record before deletion
    const [rows] = await db.query<FinancialRecordRow[]>(
      "SELECT * FROM financial_records WHERE id = ?",
      [id.trim()]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "記錄不存在" },
        { status: 404 }
      );
    }

    // Step 2 — Delete record
    await db.query("DELETE FROM financial_records WHERE id = ?", [id.trim()]);

    return NextResponse.json({
      success: true,
      message: '財務記錄刪除成功'
    });
  } catch (error) {
    console.error('刪除財務記錄失敗:', error);
    const errorMessage = error instanceof Error ? error.message : '未知錯誤';
    return NextResponse.json(
      { success: false, message: `刪除財務記錄失敗: ${errorMessage}` },
      { status: 500 }
    );
  }
} 