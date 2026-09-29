import { getAuthUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ActivityRow } from "@/types/activity";
import { AccountRow } from "@/types/auth";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // 驗證用戶身份
    const authUser = getAuthUser(request);

    if (!authUser) {
      return NextResponse.json(
        {
          success: false,
          message: "未授權訪問",
        },
        { status: 401 },
      );
    }

    // 驗證用戶是否存在
    const [userRows] = await db.query<AccountRow[]>(
      "SELECT * FROM account_management WHERE id = ?",
      [authUser.userId],
    );

    const user = userRows[0];

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "用户不存在",
        },
        { status: 404 },
      );
    }

    // 檢查權限
    // 只有管理員和教練可以修改活動
    if (user.role !== "admin" && user.role !== "trainer") {
      return NextResponse.json(
        {
          success: false,
          message: "未有權限修改活動",
        },
        { status: 403 },
      );
    }

    // 取得 activity ID
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "活動 ID 不存在",
        },
        { status: 400 },
      );
    }

    // 確認活動存在
    const [activityRows] = await db.query<ActivityRow[]>(
      "SELECT * FROM activities WHERE id = ?",
      [id],
    );

    const activity = activityRows[0];

    if (!activity) {
      return NextResponse.json(
        {
          success: false,
          message: "活動不存在",
        },
        { status: 404 },
      );
    }

    // 取得 request body
    const body = await request.json();

    const {
      activityName,
      trainerId,
      trainerName,
      startTime,
      endTime,
      location,
      description,
    } = body;

    // 驗證必需字段
    if (!activityName || !trainerId || !startTime || !endTime || !location) {
      return NextResponse.json(
        {
          success: false,
          message: "要求字段：活動名稱、負責教練、開始時間、結束時間、地點",
        },
        { status: 400 },
      );
    }

    // 確認指定教練存在
    const [trainerRows] = await db.query<AccountRow[]>(
      "SELECT * FROM account_management WHERE id = ?",
      [trainerId],
    );

    const trainer = trainerRows[0];

    if (!trainer) {
      console.log("指定的教练不存在");
      return NextResponse.json(
        {
          success: false,
          message: "指定的教练不存在",
        },
        { status: 404 },
      );
    }

    // 確認指定帳戶確實是教練
    if (trainer.role !== "trainer") {
      return NextResponse.json(
        {
          success: false,
          message: "指定的教练不存在或不是教练角色",
        },
        { status: 400 },
      );
    }

    // 驗證時間
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return NextResponse.json(
        {
          success: false,
          message: "開始時間或結束時間格式錯誤",
        },
        { status: 400 },
      );
    }

    if (end <= start) {
      return NextResponse.json(
        {
          success: false,
          message: "結束時間必須晚於開始時間",
        },
        { status: 400 },
      );
    }

    // 不允許修改成已經過去的活動
    if (start < new Date()) {
      return NextResponse.json(
        {
          success: false,
          message: "開始時間不能早於當前時間",
        },
        { status: 400 },
      );
    }

    // 更新活動
    await db.execute(
      `UPDATE activities
       SET
         activityName = ?,
         trainerId = ?,
         trainerName = ?,
         startTime = ?,
         endTime = ?,
         location = ?,
         description = ?
       WHERE id = ?`,
      [
        activityName.trim(),
        trainerId,
        trainerName?.trim() || trainer.username,
        start,
        end,
        location.trim(),
        description?.trim() || "",
        id,
      ],
    );

    // 取得更新後的活動
    const [updatedRows] = await db.query<ActivityRow[]>(
      "SELECT * FROM activities WHERE id = ?",
      [id],
    );

    const updatedActivity = updatedRows[0];

    return NextResponse.json(
      {
        success: true,
        data: updatedActivity,
        message: "修改活動成功",
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("修改活動失敗:", error);

    return NextResponse.json(
      {
        success: false,
        message: "修改活動失敗",
        error:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : "Unknown error"
            : undefined,
      },
      { status: 500 },
    );
  }
}