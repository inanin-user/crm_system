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
    if (typeof quota !== 'number') {
      return NextResponse.json({
        success: false,
        message: '配额必须是数字'
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

    // 處理配額變更（支持正數增加和負數減少）
    const currentAddedTickets = account.addedTickets || 0;
    const currentInitialTickets = account.initialTickets || 0;
    const currentUsedTickets = account.usedTickets || 0;
    const currentQuota = account.quota || 0;

    // 計算新的總配額
    const newTotalQuota = currentQuota + quota;

    // 檢查配額是否會變為負數
    if (newTotalQuota < 0) {
      return NextResponse.json({
        success: false,
        message: `無法減少 ${Math.abs(quota)} 個配額，當前只有 ${currentQuota} 個配額`
      }, { status: 400 });
    }

    // 更新累計添加套票（如果是增加配額）或已使用套票（如果是減少配額）
    let newAddedTickets = currentAddedTickets;
    let newUsedTickets = currentUsedTickets;

    if (quota > 0) {
      // 增加配額：更新 addedTickets
      newAddedTickets = currentAddedTickets + quota;
    } else if (quota < 0) {
      // 減少配額：更新 usedTickets
      newUsedTickets = currentUsedTickets + Math.abs(quota);
    }

    const updatedAccount = await Account.findByIdAndUpdate(
      id,
      {
        $set: {
          quota: newTotalQuota,
          addedTickets: newAddedTickets,
          usedTickets: newUsedTickets,
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

    const operation = quota >= 0 ? '增加' : '減少';
    const amount = Math.abs(quota);
    
    return NextResponse.json({
      success: true,
      data: updatedAccount,
      message: `成功${operation} ${amount} 個配额，總配额現為 ${newTotalQuota}`
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