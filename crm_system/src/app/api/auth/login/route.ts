import { NextResponse } from 'next/server';
import { generateToken } from '@/lib/auth';
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { AccountRow } from '@/types/auth';

interface LoginAccRow extends AccountRow {
  password: string;
}

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
    }
    
    const [rows] = await db.execute<LoginAccRow[]>(
      `SELECT * FROM account_management WHERE username = ? AND isActive = TRUE`,
      [username]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Invalid username" }, { status: 401 });
    }

    const user = rows[0];

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    // Update last login
    await db.query(
      "UPDATE account_management SET lastLogin = NOW() WHERE id = ?",
      [user.id]
    );

    const token = generateToken(
      {
        userId: user.id,
        username: user.username,
        role: user.role // admin | user | member
      }
    );

    const res = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        locations: user.locations || [],
        lastLogin: user.lastLogin,
      },
    });

    res.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      maxAge: undefined,   // ensure no persistence
      expires: undefined
    });

    return res;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}