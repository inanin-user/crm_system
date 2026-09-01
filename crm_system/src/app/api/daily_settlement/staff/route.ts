// app/api/staff/route.ts
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { db } from "@/lib/db";
import { AccountRow } from "@/types/auth";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function GET(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "未登入" }, { status: 401 });
  }

  try {
    await jwtVerify(token, JWT_SECRET);
  } catch {
    return NextResponse.json({ error: "登入已過期" }, { status: 401 });
  }

  try {
    const [rows] = await db.query<AccountRow[]>(
      `SELECT username, locations, role
       FROM account_management
       WHERE isActive = 1`
    );

    const staff = rows.map((row) => ({
      username: row.username,
      center: row.locations?.[0] ?? "",
      role: row.role,
    }));

    return NextResponse.json({ staff: staff });
  } catch (err) {
    console.error("staff route error:", err);
    return NextResponse.json({ error: "無法取得職員列表" }, { status: 500 });
  }
}