// app/api/accounts/staff/route.ts

import { NextResponse } from 'next/server';
import connectMongoDB from '@/lib/mongodb';
import Account from '@/models/Account';

export async function GET() {
  try {
    await connectMongoDB();

    const accounts = await Account
      .find({
        isActive: true,
      })
      .select('username')
      .sort({
        username: 1,
      })
      .lean();

    return NextResponse.json({
      success: true,
      data: accounts.map(account => ({
        username: account.username,
      })),
    });

  } catch (error) {
    console.error('Failed to load staff:', error);

    return NextResponse.json(
      {
        success: false,
        message: '無法取得員工資料',
      },
      {
        status: 500,
      }
    );
  }
}