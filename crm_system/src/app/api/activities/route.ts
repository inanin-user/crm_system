import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { ActivityRow } from '@/types/activity';
import { AccountRow } from '@/types/auth';
import { v4 as uuid } from "uuid";

// GET - 获取所有活动
export async function GET() {
  try {
    const [activities] = await db.query<ActivityRow[]>(
      `SELECT id, activityName, trainerId, trainerName, startTime, endTime,
              duration, participants, location, description, isActive,
              createdAt, updatedAt
      FROM activities
      WHERE isActive = 1
      ORDER BY startTime DESC`
    );

    return NextResponse.json({
      success: true,
      data: activities,
      message: `找到 ${activities.length} 个活動`
    });
  } catch (error: unknown) {
    console.error('活動列表獲取失敗:', error);
    return NextResponse.json({
      success: false,
      message: '活動列表獲取失敗',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 });
  }
}

// POST - 创建新活动
export async function POST(request: NextRequest) {
  try {

    // 验证用户身份
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({
        success: false,
        message: '未授權訪問'
      }, { status: 401 });
    }

    const [userRows] = await db.query<AccountRow[]>(
      "SELECT * FROM account_management WHERE id = ?",
      [authUser.userId]
    );
    const user = userRows[0];
    if (!user) {
      return NextResponse.json({
        success: false,
        message: '用户不存在'
      }, { status: 404 });
    }

    // 检查权限（只有管理员和教练可以创建活动）
    if (user.role !== 'admin' && user.role !== 'trainer') {
      return NextResponse.json({
        success: false,
        message: '未有權限建立活動'
      }, { status: 403 });
    }

    const body = await request.json();
    const { activityName, trainerId, trainerName, startTime, endTime, location, description } = body;

    // 验证必需字段
    if (!activityName || !trainerId || !startTime || !endTime || !location) {
      return NextResponse.json({
        success: false,
        message: '要求字段：活動名稱、負責教練、開始時間、結束時間、地點'
      }, { status: 400 });
    }

    const [trainerRows] = await db.query<AccountRow[]>(
      "SELECT * FROM account_management WHERE id = ?",
      [trainerId]
    );
    const trainer = trainerRows[0];

    if (!trainer) {
      return NextResponse.json({ error: "Trainer not found" }, { status: 404 });
    }
    if (!trainer || trainer.role !== 'trainer') {
      return NextResponse.json({
        success: false,
        message: '指定的教练不存在或不是教练角色'
      }, { status: 400 });
    }

    // 验证时间
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) {
      return NextResponse.json({
        success: false,
        message: '结束时间必须晚于开始时间'
      }, { status: 400 });
    }

    if (start < new Date()) {
      return NextResponse.json({
        success: false,
        message: '开始时间不能早于当前时间'
      }, { status: 400 });
    }

    const id = uuid();

    await db.execute(
      `INSERT INTO activities
     (id, activityName, trainerId, trainerName, startTime, endTime,
      location, description, participants, isActive)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        activityName.trim(),
        trainerId,
        trainerName || trainer.username,
        start,
        end,
        location.trim(),
        description?.trim() || "",
        JSON.stringify([]),
        1,
      ]
    );

    const [savedRows] = await db.query<ActivityRow[]>(
      "SELECT * FROM activities WHERE id = ?",
      [id]
    );
    const savedActivity = savedRows[0];

    return NextResponse.json({
      success: true,
      data: savedActivity,
      message: '建立活動成功'
    }, { status: 201 });
  } catch (error: unknown) {
    console.error('建立活動失敗:', error);
    return NextResponse.json({
      success: false,
      message: '建立活動失敗',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 });
  }
} 