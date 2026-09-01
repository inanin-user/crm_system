import { NextRequest, NextResponse } from 'next/server';
import { AccountRow } from '@/types/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {

    const searchParams = request.nextUrl.searchParams;
    const name = searchParams.get('name');
    const contact = searchParams.get('contact');

    if (!name || !contact) {
      return NextResponse.json({
        success: false,
        message: '请提供会员姓名和联系方式'
      }, { status: 400 });
    }

    const [rows] = await db.query<AccountRow[]>(
      `
  SELECT *
  FROM account_management
  WHERE role IN ('member', 'regular-member', 'premium-member')
    AND memberName = ?
    AND phone = ?
  LIMIT 1
  `,
      [name.trim(), contact.trim()]
    );

    const member = rows[0] ?? null;

    if (!member) {
      return NextResponse.json({
        success: false,
        message: '找不到匹配的会员记录'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: member.id,
        username: member.username,
        memberName: member.memberName,
        phone: member.phone,
        quota: member.quota,
        isActive: member.isActive,
        role: member.role,
        initialTickets: member.initialTickets || 0,
        addedTickets: member.addedTickets || 0,
        usedTickets: member.usedTickets || 0
      },
      message: '會員驗證通過'
    });

  } catch (error: unknown) {
    console.error('會員驗證失敗:', error);
    return NextResponse.json({
      success: false,
      message: '會員驗證出錯',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 });
  }
} 