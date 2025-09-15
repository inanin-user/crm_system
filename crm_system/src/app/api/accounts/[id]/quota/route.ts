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

    // 使用findByIdAndUpdate而不是save，避免潜在的中间件问题
    const updatedAccount = await Account.findByIdAndUpdate(
      id,
      {
        $set: {
          quota: quota,
          renewalCount: (account.renewalCount || 0) + 1
        }
      },
      {
        new: true, // 返回更新后的文档
        runValidators: true // 运行验证器
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
      message: '配额更新成功'
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