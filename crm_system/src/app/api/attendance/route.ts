import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { v4 as uuid } from "uuid";
import { RowDataPacket } from 'mysql2';
import { DailySettlementRole, MemberFields, TicketFields } from '@/types/auth';
import { AttendanceRow } from '@/types/attendance';
import { LocationCode } from '@/types/location';
import { ActivityRow } from '@/types/activity';

interface DuplicateRow extends RowDataPacket {
  id: string;
}

interface AttendanceAccRow extends RowDataPacket {
  username: string;
  role: DailySettlementRole;
  locations: LocationCode[];
}

export interface MemberRow extends MemberFields, TicketFields {
  id: number;
  role: DailySettlementRole;
  isActive: number;
}
// GET - 獲取出席記錄
export async function GET() {
  try {
    const [rows] = await db.query<AttendanceRow[]>(
      "SELECT * FROM attendance ORDER BY createdAt DESC"
    );

    const attendances: AttendanceRow[] = rows;

    return NextResponse.json(attendances, { status: 200 });
  } catch (error) {
    console.error('獲取出席記錄失敗:', error);
    return NextResponse.json(
      { error: '獲取出席記錄失敗', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST - 出席記錄建立
export async function POST(request: NextRequest) {
  try {

    // 查驗用戶身份
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: '未授權訪問' },
        { status: 401 }
      );
    }

    // 獲取用戶信息
    const [rows] = await db.query<AttendanceAccRow[]>(
      `SELECT 
        username,
        role,
        locations
       FROM account_management WHERE id = ?`,
      [authUser.userId]
    );
    const user = rows[0];
    if (!user) {
      return NextResponse.json(
        { error: '用戶不存在' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, contactInfo, location, activity, activityId, memberId } = body;

    // 验证必需字段
    if (!name || !contactInfo || !location || !activity) {
      return NextResponse.json(
        { error: '所需字段：姓名、聯絡方式、地區、活動' },
        { status: 400 }
      );
    }

    // 1. Trainer permission check
    if (user.role === "trainer") {
      if (user.locations.length === 0) {
        return NextResponse.json(
          { error: "你未有任何地區權限，無法創建出席記錄" },
          { status: 403 }
        );
      }

      if (!user.locations.includes(location)) {
        return NextResponse.json(
          { error: `你未有創建該地區出席記錄的權限: ${location}` },
          { status: 403 }
        );
      }
    }

    // 2. Member permission check
    if (["member", "regular-member", "premium-member"].includes(user.role)) {
      if (!memberId || memberId !== authUser.userId) {
        return NextResponse.json(
          { error: "會員只能為自己創建出席記錄" },
          { status: 403 }
        );
      }
    }

    // 3. Other roles not allowed
    if (user.role !== "admin" &&
      user.role !== "trainer" &&
      !["member", "regular-member", "premium-member"].includes(user.role)) {
      return NextResponse.json(
        { error: "你未有創建該地區出席記錄的權限" },
        { status: 403 }
      );
    }

    // 4. Validate member in MySQL
    const [memberRows] = await db.query<MemberRow[]>(
      `
      SELECT
        id,
        memberName,
        phone,
        role,
        quota,
        isActive,
        initialTickets,
        addedTickets,
        usedTickets
      FROM account_management
      WHERE id = ?
      `,
      [memberId]
    );

    if (memberRows.length === 0 ||
      !["member", "regular-member", "premium-member"].includes(memberRows[0].role)) {
      return NextResponse.json(
        { error: "會員ID無效" },
        { status: 400 }
      );
    }

    const member = memberRows[0];

    // 5. Duplicate attendance check (MySQL rewrite)
    const [duplicateRows] = await db.query<DuplicateRow[]>(
      `
      SELECT a.id
      FROM attendance a

      LEFT JOIN activities act
        ON a.activityId = act.id

      WHERE
        (
          -- Case 1: exact match by activityId
          a.activityId = ?

          OR

          -- Case 2: fallback match by activityName + location
          (
            a.activity = ?
            AND a.location = ?
            AND a.activityId IS NULL
          )
        )
        AND
        (
          a.name = ?
          OR a.contactInfo = ?
        )
      LIMIT 1
      `,
      [
        activityId,
        activity.trim(),
        location.trim(),
        member.memberName,
        member.phone
      ]
    );

    if (duplicateRows.length > 0) {
      return NextResponse.json(
        { error: "你已簽到" },
        { status: 400 }
      );
    }


    if (!member.isActive) {
      return NextResponse.json(
        { error: '會員户口已被禁用' },
        { status: 400 }
      );
    }

    if (!member.quota || member.quota <= 0) {
      return NextResponse.json(
        { error: '该會員配额不足，不能参加活動' },
        { status: 400 }
      );
    }

    // 验证會員信息是否匹配
    const isNameMatch = member.memberName === name.trim();
    const isContactMatch = member.phone === contactInfo.trim();

    if (!isNameMatch || !isContactMatch) {
      return NextResponse.json(
        { error: '姓名與聯絡方式不符合會員記錄' },
        { status: 400 }
      );
    }

    // 扣除配额（更新套票相關字段）
    const currentUsedTickets = member.usedTickets || 0;
    const currentInitialTickets = member.initialTickets || 0;
    const currentAddedTickets = member.addedTickets || 0;

    // 增加已使用套票次數
    const newUsedTickets = currentUsedTickets + 1;

    // 重新計算剩余配额
    const newQuota = currentInitialTickets + currentAddedTickets - newUsedTickets;

    // 更新數據
    member.quota = Math.max(0, newQuota); // 確保不為負數
    member.usedTickets = newUsedTickets;

    await db.query(
      `
      UPDATE account_management
      SET
        quota = ?, 
        renewalCount = ?, 
        initialTickets = ?, 
        addedTickets = ?, 
        usedTickets = ?
      WHERE id = ?
      `,
      [
        member.quota,
        member.renewalCount,
        member.initialTickets,
        member.addedTickets,
        member.usedTickets,
        member.id
      ]
    );

    // 1. Generate UUID
    const attendanceId = uuid();

    // 2. Insert with explicit UUID
    await db.query(
      `
      INSERT INTO attendance
        (id, name, contactInfo, location, activity, activityId, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
      `,
      [
        attendanceId,
        name.trim(),
        contactInfo.trim(),
        location.trim(),
        activity.trim(),
        activityId ?? null
      ]
    );

    const [attendanceRows] = await db.query<AttendanceRow[]>(
      `
      SELECT *
      FROM attendance
      WHERE id = ?
      `,
      [attendanceId]
    );

    const savedAttendance = attendanceRows[0];
    // 3. Add participant to activity (simulate $addToSet)
    if (activityId) {
      const [activityRows] = await db.query<ActivityRow[]>(
        `
        SELECT participants
        FROM activities
        WHERE id = ?
        `,
        [activityId]
      );
      console.log(activityRows[0].participants);
      const currentParticipants: string[] = activityRows[0].participants;
      const updatedParticipants = Array.from(
        new Set([...currentParticipants, name.trim()])
      );

      await db.query(
        `
        UPDATE activities
        SET participants = ?
        WHERE id = ?
        `,
        [JSON.stringify(updatedParticipants), activityId]
      );
    }

    return NextResponse.json({
      ...savedAttendance.toObject(),
      quotaDeducted: !!memberId,
      activityUpdated: !!activityId
    }, { status: 201 });
  } catch (error) {
    console.error('創建出席記錄失敗:', error);
    return NextResponse.json(
      { error: '創建出席記錄失敗', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 