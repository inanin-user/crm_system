import { NextRequest, NextResponse } from 'next/server';
import { AttendanceRow } from '@/types/attendance';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const name = searchParams.get('name');
    const contact = searchParams.get('contact');

    if (!name || !contact) {
      return NextResponse.json({
        success: false,
        message: '请提供会员姓名和联系方式'
      }, { status: 400 });
    }

    const whereClauses : string = "name = ?, contactInfo = ?"
    const sql : string = `
      SELECT * 
      FROM attendance
      WHERE ${whereClauses}
      ORDER BY createdAt DESC
    `;

    // 根据姓名和联系方式查找出席记录
    const attendanceRecords = await db.query<AttendanceRow[]>(sql);

    return NextResponse.json({
      success: true,
      data: attendanceRecords,
      message: `找到 ${attendanceRecords.length} 条出席记录`
    });

  } catch (error: unknown) {
    console.error('获取会员出席记录失败:', error);
    return NextResponse.json({
      success: false,
      message: '获取出席记录失败',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 });
  }
} 