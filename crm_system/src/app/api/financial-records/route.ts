import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { FinancialRecordRow } from '@/types/financialRecord';
import { RowDataPacket } from "mysql2";
import { AccountRow } from '@/types/auth';
import { v4 as uuid } from "uuid";
import { LocationCode } from '@/types/location';


interface CountRow extends RowDataPacket {
  total: number;
}

interface StatsRow extends RowDataPacket {
  totalIncome: number;
  totalExpense: number;
}

// 獲取所有財務記錄
export async function GET(request: NextRequest) {
  try {

    const { searchParams } = new URL(request.url);
    const memberName = searchParams.get('memberName');
    const recordType = searchParams.get('recordType');
    const location = searchParams.get('location');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const skip = (page - 1) * limit;

    const sql = `
      SELECT *
      FROM financial_records
      WHERE 1=1
        AND (? IS NULL OR memberName LIKE CONCAT('%', ?, '%'))
        AND (? IS NULL OR recordType = ?)
        AND (? IS NULL OR location = ?)
      ORDER BY recordDate DESC, createdAt DESC
      LIMIT ? OFFSET ?
    `;

    const params: (string | number | LocationCode | null)[] = [
      memberName ?? null, memberName ?? null,
      recordType ?? null, recordType ?? null,
      location ?? null, location ?? null,
      limit, skip
    ];

    const [records] = await db.query<FinancialRecordRow[]>(sql, params);

    // 手動處理 createdBy 字段
    const recordsWithUser = records.map(record => {
      // const recordObj = record.toObject();
      return {
        ...record,
        createdBy: {
          username: '系統用戶' // 使用默認值
        }
      };
    });





    const countSql = `
  SELECT COUNT(*) AS total
  FROM financial_records
  WHERE 1=1
    AND (? IS NULL OR memberName LIKE CONCAT('%', ?, '%'))
    AND (? IS NULL OR recordType = ?)
    AND (? IS NULL OR location = ?)
`;

    const statsSql = `
  SELECT
    SUM(CASE WHEN recordType = 'income' THEN totalAmount ELSE 0 END) AS totalIncome,
    SUM(CASE WHEN recordType = 'expense' THEN totalAmount ELSE 0 END) AS totalExpense
  FROM financial_records
  WHERE 1=1
    AND (? IS NULL OR memberName LIKE CONCAT('%', ?, '%'))
    AND (? IS NULL OR recordType = ?)
    AND (? IS NULL OR location = ?)
`;

    const countParams: (string | number | null)[] = [
      memberName ?? null, memberName ?? null,
      recordType ?? null, recordType ?? null,
      location ?? null, location ?? null
    ];

    const [[countRow]] = await db.query<CountRow[]>(countSql, countParams);
    const [[statsRow]] = await db.query<StatsRow[]>(statsSql, countParams);

    const total = countRow.total;
    const stats = {
      totalIncome: statsRow.totalIncome ?? 0,
      totalExpense: statsRow.totalExpense ?? 0
    };

    const totalIncome = stats.totalIncome || 0;
    const totalExpense = stats.totalExpense || 0;
    const netAmount = totalIncome - totalExpense;

    return NextResponse.json({
      success: true,
      data: {
        records: recordsWithUser,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        stats: {
          totalIncome,
          totalExpense,
          netAmount
        }
      }
    });
  } catch (error) {
    console.error('獲取財務記錄失敗:', error);
    return NextResponse.json(
      { success: false, message: '獲取財務記錄失敗' },
      { status: 500 }
    );
  }
}

// 創建新的財務記錄
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      recordType,
      memberName,
      item,
      details,
      location,
      unitPrice,
      quantity,
      recordDate,
      createdBy
    } = body;


    // 必填字段
    if (!recordType || !memberName || !item || !location || unitPrice === undefined || !quantity) {
      console.log('必填字段檢驗失敗');
      return NextResponse.json(
        { success: false, message: '請填寫所有必填字段' },
        { status: 400 }
      );
    }

    // 檢驗數值
    if (unitPrice < 0 || quantity < 1) {
      console.log('數值檢驗失敗:', { unitPrice, quantity });
      return NextResponse.json(
        { success: false, message: '單價和數量必須為正數' },
        { status: 400 }
      );
    }

    const [accountRows] = await db.query<AccountRow[]>(
      "SELECT id FROM account_management WHERE id = ? LIMIT 1",
      [createdBy.trim()]
    );

    if (accountRows.length === 0) {
      return NextResponse.json(
        { success: false, message: "創建者不存在" },
        { status: 400 }
      );
    }

    console.log('所有檢驗通過，開始創建記錄...');

    const recordId = uuid();

    await db.query(
      `
  INSERT INTO financial_records
    (id, recordType, memberName, item, details, location,
     unitPrice, quantity, totalAmount, recordDate, createdBy,
     createdAt, updatedAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
  `,
      [
        recordId,
        recordType,
        memberName.trim(),
        item.trim(),
        details?.trim() ?? null,
        location.trim(),
        unitPrice,
        quantity,
        unitPrice * quantity, // auto-calc totalAmount
        recordDate ? new Date(recordDate) : new Date(),
        createdBy.trim()
      ]
    );

    const [rows] = await db.query<FinancialRecordRow[]>(
      "SELECT * FROM financial_records WHERE id = ?",
      [recordId]
    );

    const newRecord = rows[0];

    return NextResponse.json({
      success: true,
      message: '財務記錄創建成功',
      data: newRecord
    }, { status: 201 });
  } catch (error) {
    console.error('創建財務記錄失敗:', error);
    const errorMessage = error instanceof Error ? error.message : '未知錯誤';
    return NextResponse.json(
      { success: false, message: `創建財務記錄失敗: ${errorMessage}` },
      { status: 500 }
    );
  }
}