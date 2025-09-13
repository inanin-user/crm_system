import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Account from '@/models/Account';

// 迁移现有会员角色为新的会员类型
export async function POST() {
  try {
    await connectDB();
    
    // 查找所有角色为 'member' 的账户
    const memberAccounts = await Account.find({ role: 'member' });
    
    console.log(`找到 ${memberAccounts.length} 个需要迁移的会员账户`);
    
    // 批量更新这些账户的角色为 'regular-member'
    const updateResult = await Account.updateMany(
      { role: 'member' },
      { 
        $set: { 
          role: 'regular-member',
          // 为现有会员添加默认值
          herbalifePCNumber: '待更新',
          joinDate: new Date(),
          trainerIntroducer: '待指定'
        } 
      }
    );
    
    console.log(`成功更新了 ${updateResult.modifiedCount} 个会员账户`);
    
    return NextResponse.json({
      success: true,
      message: `成功将 ${updateResult.modifiedCount} 个会员账户迁移为普通会员`,
      details: {
        found: memberAccounts.length,
        updated: updateResult.modifiedCount
      }
    });
    
  } catch (error) {
    console.error('迁移会员账户失败:', error);
    return NextResponse.json(
      { success: false, message: '迁移会员账户失败', error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}