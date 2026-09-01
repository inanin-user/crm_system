import { NextRequest, NextResponse } from 'next/server';
import Attendance from '@/models/Attendance';
import { AttendanceRow } from '@/types/attendance';
import { db } from '@/lib/db';

// PATCH - 更新出席记录
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {

    const { id } = await params;

    const body = await request.json();
    const { name, contactInfo, location, activity, status } = body;

    const updateFields: string[] = [];
    const updateValues: (string | number | null)[] = [];

    if (name !== undefined) {
      updateFields.push("name = ?");
      updateValues.push(name.trim());
    }

    if (contactInfo !== undefined) {
      updateFields.push("contactInfo = ?");
      updateValues.push(contactInfo.trim());
    }

    if (location !== undefined) {
      updateFields.push("location = ?");
      updateValues.push(location.trim());
    }

    if (activity !== undefined) {
      updateFields.push("activity = ?");
      updateValues.push(activity.trim());
    }

    if (status !== undefined) {
      updateFields.push("status = ?");
      updateValues.push(status);
    }


    updateFields.push("updatedAt = NOW()");

    const sqlUpdate = `
      UPDATE attendance
      SET ${updateFields.join(", ")}
      WHERE id = ?
    `;

    updateValues.push(id);

    await db.query(sqlUpdate, updateValues);

    const [updatedRows] = await db.query<AttendanceRow[]>(
          `
      SELECT *
      FROM attendance
      WHERE id = ?
      `,
      [id]
    );

    const updatedAttendance = updatedRows[0];


    if (!updatedAttendance) {
      return NextResponse.json(
        { error: '搜尋不到出席記錄' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedAttendance, { status: 200 });
  } catch (error) {
    console.error('出席記錄更新失敗:', error);
    return NextResponse.json(
      { error: '出席記錄更新失敗', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}

// DELETE - 删除指定ID的出席记录
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 验证ID格式
    // if (!mongoose.Types.ObjectId.isValid(id)) {
    //   return NextResponse.json(
    //     { error: '无效的记录ID' },
    //     { status: 400 }
    //   );
    // }

    const deletedAttendance = await Attendance.findByIdAndDelete(id);

    if (!deletedAttendance) {
      return NextResponse.json(
        { error: '未找到指定的出席记录' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: '出席记录已成功删除', deletedRecord: deletedAttendance },
      { status: 200 }
    );
  } catch (error) {
    console.error('删除出席记录失败:', error);
    return NextResponse.json(
      { error: '删除出席记录失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
} 