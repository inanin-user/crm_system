// app/api/modifiedHistory/route.ts
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { db } from "@/lib/db";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function GET(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) return NextResponse.json({ error: "未登入" }, { status: 401 });

  try {
    await jwtVerify(token, JWT_SECRET);
  } catch {
    return NextResponse.json({ error: "登入已過期" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username");
  const submittedAt = searchParams.get("submittedAt");
  if (!username || !submittedAt) {
    return NextResponse.json({ error: "缺少參數" }, { status: 400 });
  }

  try {
    const [rows] = await db.query(
      `SELECT id, modified_by, modified_at, field_name, previous_value, updated_value
       FROM modify_history
       WHERE settlement_username = ? AND settlement_submitted_at = ?
       ORDER BY modified_at DESC, id DESC`,
      [username, submittedAt]
    );
    return NextResponse.json({ history: rows });
  } catch (err) {
    console.error("modifiedHistory route error:", err);
    return NextResponse.json({ error: "無法取得修改記錄" }, { status: 500 });
  }
}