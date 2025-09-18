import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import Activity from '@/models/Activity';
import Account from '@/models/Account';
import { getAuthUser } from '@/lib/auth';

// 获取用户有权限访问的出席记录
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // 验证用户身份
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: '未授权访问' },
        { status: 401 }
      );
    }

    // 获取用户详细信息
    const user = await Account.findById(authUser.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: '用户不存在' },
        { status: 404 }
      );
    }

    const attendanceQuery: Record<string, unknown> = {};

    // 根据用户角色设置查询条件
    if (user.role === 'admin') {
      // 管理员可以看到所有出席记录
      // 不设置任何过滤条件
    } else if (user.role === 'trainer') {
      // 教练只能看到他们有权限的地区的出席记录
      if (!user.locations || user.locations.length === 0) {
        // 如果教练没有任何地区权限，返回空数组
        return NextResponse.json({
          success: true,
          data: [],
          message: '您目前没有任何地区权限，无法查看出席记录'
        });
      }
      
      // 过滤出席记录，只显示教练有权限的地区
      attendanceQuery.location = { $in: user.locations };
    } else {
      // 其他角色暂时不允许访问出席记录
      return NextResponse.json(
        { success: false, message: '您没有权限查看出席记录' },
        { status: 403 }
      );
    }

    // 获取URL参数
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    const date = searchParams.get('date');
    const location = searchParams.get('location');
    const limit = parseInt(searchParams.get('limit') || '1000'); // 默认返回1000条记录
    const page = parseInt(searchParams.get('page') || '1'); // 页码，默认1
    const skip = (page - 1) * limit;

    // 添加额外的过滤条件
    if (name) {
      attendanceQuery.name = { $regex: name, $options: 'i' };
    }

    if (date) {
      const targetDate = new Date(date);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      attendanceQuery.createdAt = {
        $gte: targetDate,
        $lt: nextDay
      };
    }

    if (location) {
      // 如果指定了地区，还需要确保用户有权限查看该地区
      if (user.role === 'trainer' && !user.locations.includes(location)) {
        return NextResponse.json(
          { success: false, message: '您没有权限查看该地区的出席记录' },
          { status: 403 }
        );
      }
      attendanceQuery.location = location;
    }

    // 並行執行 count 和 find 查詢
    const [totalCount, attendances] = await Promise.all([
      Attendance.countDocuments(attendanceQuery),
      Attendance.find(attendanceQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean() // 使用 lean() 獲取原始 JSON 對象，提升性能
    ]);

    // 優化：批量獲取所有相關的活動信息
    const activityIds = attendances
      .map(a => a.activityId)
      .filter(Boolean);

    const activityQueries = attendances
      .filter(a => !a.activityId && a.activity && a.location)
      .map(a => ({
        activityName: a.activity,
        location: a.location,
        isActive: true
      }));

    // 批量查詢活動信息
    const [activitiesByIds, activitiesByNameLocation] = await Promise.all([
      activityIds.length > 0
        ? Activity.find({ _id: { $in: activityIds } }).lean()
        : Promise.resolve([]),
      activityQueries.length > 0
        ? Activity.find({ $or: activityQueries }).sort({ createdAt: -1 }).lean()
        : Promise.resolve([])
    ]);

    // 建立查找表以提升性能
    const activityByIdMap = new Map(
      activitiesByIds.map(activity => [activity._id.toString(), activity])
    );

    const activityByNameLocationMap = new Map(
      activitiesByNameLocation.map(activity => [
        `${activity.activityName}-${activity.location}`,
        activity
      ])
    );

    // 為每個出席記錄添加教練信息
    const attendancesWithTrainer = attendances.map(attendance => {
      let trainerName = null;

      // 優先通過 activityId 查找
      if (attendance.activityId) {
        const activity = activityByIdMap.get(attendance.activityId.toString());
        if (activity) {
          trainerName = activity.trainerName;
        }
      }

      // 如果沒找到，通過活動名稱和地點查找
      if (!trainerName && attendance.activity && attendance.location) {
        const key = `${attendance.activity}-${attendance.location}`;
        const activity = activityByNameLocationMap.get(key);
        if (activity) {
          trainerName = activity.trainerName;
        }
      }

      return {
        ...attendance,
        trainerName: trainerName || null
      };
    });

    return NextResponse.json({
      success: true,
      data: attendancesWithTrainer,
      userRole: user.role,
      userLocations: user.locations || [],
      pagination: {
        total: totalCount,
        page: page,
        limit: limit,
        pages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('获取出席记录失败:', error);
    return NextResponse.json(
      { success: false, message: '获取出席记录失败' },
      { status: 500 }
    );
  }
} 