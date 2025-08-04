import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Attendance from '@/models/Attendance';

// GET - 获取所有出席记录
export async function GET() {
  try {
    await connectDB();
    const attendances = await Attendance.find({}).sort({ createdAt: -1 });
    
    return NextResponse.json(attendances, { status: 200 });
  } catch (error) {
    console.error('获取出席记录失败:', error);
    return NextResponse.json(
      { error: '获取出席记录失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}

// POST - 创建新的出席记录
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    
    const { name, contactInfo, location, activity } = body;
    
    // 验证必需字段
    if (!name || !contactInfo || !location || !activity) {
      return NextResponse.json(
        { error: '所有字段都是必需的：姓名、联系方式、地点、活动内容' },
        { status: 400 }
      );
    }
    
    const newAttendance = new Attendance({
      name: name.trim(),
      contactInfo: contactInfo.trim(),
      location: location.trim(),
      activity: activity.trim()
    });
    
    const savedAttendance = await newAttendance.save();
    
    return NextResponse.json(savedAttendance, { status: 201 });
  } catch (error) {
    console.error('创建出席记录失败:', error);
    return NextResponse.json(
      { error: '创建出席记录失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
} 