import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import Account from '@/models/Account';
import { getAuthUser } from '@/lib/auth';

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
    
    // 验证用户身份
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    // 获取用户详细信息
    const user = await Account.findById(authUser.userId);
    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }
    
    const body = await request.json();
    const { name, contactInfo, location, activity } = body;
    
    // 验证必需字段
    if (!name || !contactInfo || !location || !activity) {
      return NextResponse.json(
        { error: '所有字段都是必需的：姓名、联系方式、地点、活动内容' },
        { status: 400 }
      );
    }
    
    // 检查用户是否有权限在该地区创建记录
    if (user.role === 'trainer') {
      // 教练只能在他们有权限的地区创建记录
      if (!user.locations || user.locations.length === 0) {
        return NextResponse.json(
          { error: '您没有任何地区权限，无法创建出席记录' },
          { status: 403 }
        );
      }
      
      if (!user.locations.includes(location)) {
        return NextResponse.json(
          { error: `您没有在 ${location} 创建出席记录的权限` },
          { status: 403 }
        );
      }
    } else if (user.role !== 'admin') {
      // 非管理员和教练暂时不允许创建记录
      return NextResponse.json(
        { error: '您没有权限创建出席记录' },
        { status: 403 }
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