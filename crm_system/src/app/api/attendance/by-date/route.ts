import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Attendance from '@/models/Attendance';

// GET - 按日期获取出席记录
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
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
    
    // 查询指定日期范围内的记录
    const attendances = await Attendance.find({
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ createdAt: -1 });
    
    return NextResponse.json(attendances, { status: 200 });
  } catch (error) {
    console.error('按日期获取出席记录失败:', error);
    return NextResponse.json(
      { error: '获取出席记录失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
} 