import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // Check if the user is authenticated
    const authUser = getAuthUser(request);
    
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: 'Not logged in' },
        { status: 401 }
      );
    }

    const [rows]: any = await db.query(
      `SELECT
        id,
        username,
        role,
        isActive,
        locations,
        lastLogin,
        createdAt
      FROM account_management
      WHERE id = ?
      LIMIT 1`,
      [authUser.userId]
    );

    const user = rows[0];

    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, message: 'Account is disabled' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: String(user._id),
        username: user.username,
        role: user.role,
        locations: user.locations || [],
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Error fetching user info:', error);
    return NextResponse.json(
      { success: false, message: 'Server internal error' },
      { status: 500 }
    );
  }
} 