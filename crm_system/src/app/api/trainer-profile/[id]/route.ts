import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { AccountRow } from '@/types/auth';
import { v4 as uuid } from "uuid";

interface Params {
  id: string;
}

interface TrainerProfileRow extends RowDataPacket {
  id: string;
  trainerId: string;    // 教练ID
  trainerUsername: string;               // 教练用户名
  otherWorkHours: number;                // 其他工作时间（小时）
  notes?: string;                        // 备注
  createdAt: Date;
  updatedAt: Date;
}

// GET - 获取教练详细信息
export async function GET(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    const { id } = await params;

    const [rows] = await db.query<TrainerProfileRow[]>(
      "SELECT * FROM trainer_profiles WHERE trainerId = ? LIMIT 1",
      [id.trim()]
    );

    const profile = rows[0] ?? null;

    if (!profile) {
      return NextResponse.json({
        success: false,
        message: '教练档案不存在'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: profile,
      message: '获取教练档案成功'
    });

  } catch (error: unknown) {
    console.error('获取教练档案失败:', error);
    return NextResponse.json({
      success: false,
      message: '获取教练档案失败',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 });
  }
}

// PUT - 更新或创建教练档案
export async function PUT(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    const { id } = await params;
    const { otherWorkHours, notes, trainerUsername } = await request.json();

    // 验证输入
    if (typeof otherWorkHours !== 'number' || otherWorkHours < 0) {
      return NextResponse.json({
        success: false,
        message: '工作时间必须是非负数'
      }, { status: 400 });
    }

    const [accountRows] = await db.query<AccountRow[]>(
      "SELECT id, username, role FROM account_management WHERE id = ? LIMIT 1",
      [id.trim()]
    );
    const trainer = accountRows[0];
    
    if (!trainer || trainer.role !== 'trainer') {
      return NextResponse.json({
        success: false,
        message: '教练不存在'
      }, { status: 404 });
    }

    const trainerProfileid = uuid();

    // Step 2 — Upsert trainer profile
    await db.query(
      `
    INSERT INTO trainer_profiles (
      id, trainerId, trainerUsername, otherWorkHours, notes, createdAt, updatedAt
    )
    VALUES (
      ?, ?, ?, ?, ?, NOW(), NOW()
    )
    ON DUPLICATE KEY UPDATE
      trainerUsername = VALUES(trainerUsername),
      otherWorkHours = VALUES(otherWorkHours),
      notes = VALUES(notes),
      updatedAt = NOW()
    `,
      [
        trainerProfileid,
        id.trim(),
        trainerUsername ?? trainer.username,
        otherWorkHours,
        notes ?? ""
      ]
    );

    // Step 3 — Fetch updated profile (like { new: true })
    const [rows] = await db.query<TrainerProfileRow[]>(
      "SELECT * FROM trainer_profiles WHERE trainerId = ? LIMIT 1",
      [id.trim()]
    );

    const profile = rows[0];

    return NextResponse.json({
      success: true,
      data: profile,
      message: '教练档案更新成功'
    });

  } catch (error: unknown) {
    console.error('更新教练档案失败:', error);
    return NextResponse.json({
      success: false,
      message: '更新教练档案失败',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 });
  }
} 