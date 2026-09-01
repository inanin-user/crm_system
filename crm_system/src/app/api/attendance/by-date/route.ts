import { NextRequest, NextResponse } from 'next/server';
import Attendance from '@/models/Attendance';
import { getAuthUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { AccountRow } from '@/types/auth';
import { AttendanceRow } from '@/types/attendance';

// GET - 按日期获取出席记录
export async function GET(request: NextRequest) {
  try {

    // 验证用户身份
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    // 获取用户详细信息
    const [rows] = await db.query<AccountRow[]>(
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
        { error: '用户不存在' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json(
        { error: '請提供日期參數' },
        { status: 400 }
      );
    }

    // 解析日期并设置当天的开始和结束时间
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const whereClauses: string[] = [
      "createdAt >= ?",
      "createdAt <= ?"
    ];

    const params: (string | number)[] = [
      startDate.toISOString().slice(0, 19).replace("T", " "),
      endDate.toISOString().slice(0, 19).replace("T", " ")
    ];

    // Role-based filtering
    if (user.role === "admin") {
      whereClauses.push("? = 'admin'");
      params.push(user.role);
    } else if (user.role === "trainer") {
      if (user.locations.length === 0) {
        return NextResponse.json([], { status: 200 });
      }

      const placeholders = user.locations.map(() => "?").join(",");
      whereClauses.push(`location IN (${placeholders})`);
      params.push(...user.locations);
    } else {
      return NextResponse.json(
        { error: "您没有权限查看出席记录" },
        { status: 403 }
      );
    }

    const sql = `
      SELECT *
      FROM attendance
      WHERE ${whereClauses.join(" AND ")}
      ORDER BY createdAt DESC
    `;

    const [attendances] = await db.query<AttendanceRow[]>(sql, params);

    return NextResponse.json(attendances, { status: 200 });
  } catch (error) {
    console.error('按日期获取出席记录失败:', error);
    return NextResponse.json(
      { error: '获取出席记录失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
} 