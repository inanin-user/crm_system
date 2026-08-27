import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const res = NextResponse.json({ success: true });
      res.cookies.set("auth_token", "", {
      httpOnly: true,
      expires: new Date(0),
      path: "/",
    });
    return res;
  } catch (error) {
    console.error('Logout Error:', error);
    return NextResponse.json(
      { success: false, message: 'Server internal error' },
      { status: 500 }
    );
  }
} 