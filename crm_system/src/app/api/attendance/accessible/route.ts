import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { AttendanceRow } from '@/types/attendance';
import { LocationCode } from '@/types/location';


interface User extends RowDataPacket {
  id: number;
  role: string;
  locations: LocationCode[];
}

interface AttendanceWithTrainerRow extends AttendanceRow {
  trainerName: string;
}


// 获取用户有权限访问的出席记录
export async function GET(request: NextRequest) {
  try {

    // 验证用户身份
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: '未授权访问' },
        { status: 401 }
      );
    }

    // get acc detail
    const [rows] = await db.query<User[]>(
      "SELECT * FROM account_management WHERE id = ?",
      [authUser.userId]
    );

    const user = rows[0];
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User does not exist.' },
        { status: 404 }
      );
    }

    const whereClauses: string[] = [];
    const params: (string | number)[] = [];

    if (user.role === "admin") {
      whereClauses.push("1=1");
    } else if (user.role === "trainer") {
      if (user.locations.length === 0) {
        return NextResponse.json({
          success: true,
          data: [],
          message: "您目前沒有任何地區權限，無法查看出席記錄"
        });
      }

      const placeholders = user.locations.map(() => "?").join(",");
      whereClauses.push(`a.location IN (${placeholders})`);
      params.push(...user.locations);
    } else {
      return NextResponse.json(
        { success: false, message: "您沒有權限查看出席記錄" },
        { status: 403 }
      );
    }

    // -------------------------------
    // 2. URL filters
    // -------------------------------
    const { searchParams } = new URL(request.url);

    const name = searchParams.get("name");
    const date = searchParams.get("date");
    const location = searchParams.get("location") as LocationCode;

    const limit = Number(searchParams.get("limit") ?? "1000");
    const page = Number(searchParams.get("page") ?? "1");
    const offset = (page - 1) * limit;

    if (name) {
      whereClauses.push("a.name LIKE CONCAT('%', ?, '%')");
      params.push(name);
    }

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);

      whereClauses.push("a.createdAt >= ? AND a.createdAt < ?");
      params.push(startDate.toISOString().slice(0, 19).replace("T", " "));
      params.push(endDate.toISOString().slice(0, 19).replace("T", " "));
    }

    if (location) {
      if (user.role === "trainer" && !user.locations.includes(location)) {
        return NextResponse.json(
          { success: false, message: "您沒有權限查看該地區的出席記錄" },
          { status: 403 }
        );
      }
      whereClauses.push("a.location = ?");
      params.push(location);
    }

    const whereSQL = whereClauses.length > 0 ? whereClauses.join(" AND ") : "1=1";

    // -------------------------------
    // 3. Count query
    // -------------------------------
    const countSQL = `
    SELECT COUNT(*) AS totalCount
    FROM attendance a
    WHERE ${whereSQL}
  `;

    const [countRows] = await db.query(countSQL, params);
    const totalCount = (countRows as { totalCount: number }[])[0].totalCount;

    // -------------------------------
    // 4. Main query with trainerName join
    // -------------------------------
    const dataSQL = `
    SELECT 
      a.id,
      a.name,
      a.contactInfo,
      a.location,
      a.activity,
      a.activityId,
      a.status,
      a.createdAt,
      a.updatedAt,
      COALESCE(act1.trainerName, act2.trainerName) AS trainerName
    FROM attendance a
    LEFT JOIN activities act1
      ON a.activityId = act1.id
    LEFT JOIN activities act2
      ON a.activity = act2.activityName
      AND a.location = act2.location
      AND act2.isActive = TRUE
    WHERE ${whereSQL}
    ORDER BY a.createdAt DESC
    LIMIT ? OFFSET ?
  `;

    const dataParams = [...params, limit, offset];
    const [attendances] = await db.query<AttendanceWithTrainerRow[]>(dataSQL, dataParams);

    const attendancesWithTrainer = attendances.map((row) => ({
      id: row.id,
      name: row.name,
      contactInfo: row.contactInfo,
      location: row.location,
      activity: row.activity,
      activityId: row.activityId,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      trainerName: row.trainerName
    }));

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