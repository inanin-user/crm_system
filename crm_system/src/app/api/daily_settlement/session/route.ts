// app/api/session/route.ts
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function GET(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "未登入" }, { status: 401 });
  }
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return NextResponse.json({
      username: payload.username,
      role: payload.role,
      center: payload.center,
    });
  } catch {
    return NextResponse.json({ error: "登入已過期" }, { status: 401 });
  }
}