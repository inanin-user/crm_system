import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ActivityRow } from '@/types/activity';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const trainerId = searchParams.get('trainerId');

    if (!trainerId) {
      return NextResponse.json({
        success: false,
        message: '请提供教练ID'
      }, { status: 400 });
    }

    const [activityRows] = await db.query<ActivityRow[]>(
      `SELECT id, activityName, trainerId, trainerName, startTime, endTime,
          duration, participants, location, description, isActive,
          createdAt, updatedAt
   FROM activities
   WHERE trainerId = ? AND isActive = 1
   ORDER BY startTime DESC`,
      [trainerId]
    );
    const parseParticipants = (value: unknown): string[] => {
      if (Array.isArray(value)) return value;        // JSON column, already parsed
      if (typeof value === 'string' && value.trim()) {
        try {
          const parsed = JSON.parse(value);          // TEXT/VARCHAR column
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      }
      return [];
    };
    const activities = activityRows.map((row) => ({
      ...row,
      participants: parseParticipants(row.participants)
    }));

    return NextResponse.json({
      success: true,
      data: activities,
      message: `找到 ${activities.length} 条活动记录`
    });

  } catch (error: unknown) {
    console.error('获取教练活动记录失败:', error);
    return NextResponse.json({
      success: false,
      message: '获取活动记录失败',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 });
  }
} 