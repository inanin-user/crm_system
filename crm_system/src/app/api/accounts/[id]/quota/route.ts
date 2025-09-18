import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Account from '@/models/Account';
import mongoose from 'mongoose';

interface Params {
  id: string;
}

export async function PUT(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    await connectDB();

    const { id } = await params;
    const { quota } = await request.json();

    // 验证输入
    if (typeof quota !== 'number' || quota < 0) {
      return NextResponse.json({
        success: false,
        message: '配额必须是非负数'
      }, { status: 400 });
    }

    // 验证ID格式
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({
        success: false,
        message: '无效的账户ID'
      }, { status: 400 });
    }

    // 查找账户
    const account = await Account.findById(id);

    if (!account) {
      return NextResponse.json({
        success: false,
        message: '账户不存在'
      }, { status: 404 });
    }

    // 检查是否为会员账户
    const memberRoles = ['member', 'regular-member', 'premium-member'];
    if (!memberRoles.includes(account.role)) {
      return NextResponse.json({
        success: false,
        message: '只能更新会员账户的配额'
      }, { status: 400 });
    }

    // 累加配额而不是替换
    const currentAddedTickets = account.addedTickets || 0;
    const currentInitialTickets = account.initialTickets || 0;
    const currentUsedTickets = account.usedTickets || 0;

    // 新的累計添加套票 = 原有添加套票 + 新增配额
    const newAddedTickets = currentAddedTickets + quota;

    // 新的總配额 = 初始套票 + 新的累計添加套票 - 已使用套票
    const newTotalQuota = currentInitialTickets + newAddedTickets - currentUsedTickets;

    const updatedAccount = await Account.findByIdAndUpdate(
      id,
      {
        $set: {
          quota: newTotalQuota,
          addedTickets: newAddedTickets,
          renewalCount: (account.renewalCount || 0) + 1
        }
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!updatedAccount) {
      return NextResponse.json({
        success: false,
        message: '更新失败'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: updatedAccount,
      message: `成功添加 ${quota} 個配额，總配额現為 ${newTotalQuota}`
    });

  } catch (error: unknown) {
    console.error('更新配额失败:', error);
    console.error('错误堆栈:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json({
      success: false,
      message: '更新配额失败',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    }, { status: 500 });
  }
} 