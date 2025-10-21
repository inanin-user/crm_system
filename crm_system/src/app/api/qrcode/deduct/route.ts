import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import QRCode from '@/models/QRCode';
import Account from '@/models/Account';
import { getAuthUser } from '@/lib/auth';
import cache from '@/lib/cache';

// 處理 QR Code 掃描並扣除 quota
export async function POST(request: NextRequest) {
  try {
    // 獲取當前登錄用戶
    const authUser = getAuthUser(request);
    
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: '未登錄，請先登錄' },
        { status: 401 }
      );
    }

    // 檢查用戶角色是否為會員
    const memberRoles = ['member', 'regular-member', 'premium-member'];
    if (!memberRoles.includes(authUser.role)) {
      return NextResponse.json(
        { success: false, message: '只有會員可以使用此功能' },
        { status: 403 }
      );
    }

    const { qrCodeData } = await request.json();

    if (!qrCodeData) {
      return NextResponse.json(
        { success: false, message: '請提供二維碼數據' },
        { status: 400 }
      );
    }

    let parsedData;
    try {
      parsedData = JSON.parse(qrCodeData);
    } catch {
      return NextResponse.json(
        { success: false, message: '二維碼數據格式錯誤' },
        { status: 400 }
      );
    }

    const { number } = parsedData;

    if (!number) {
      return NextResponse.json(
        { success: false, message: '二維碼數據缺少編號信息' },
        { status: 400 }
      );
    }

    await connectDB();

    // 查找對應的二維碼記錄
    const qrCodeRecord = await QRCode.findOne({
      qrCodeNumber: number,
      isActive: true
    }).lean();

    if (!qrCodeRecord) {
      return NextResponse.json(
        { success: false, message: '未找到對應的二維碼記錄或二維碼已失效' },
        { status: 404 }
      );
    }

    // 獲取當前用戶的完整信息
    const memberAccount = await Account.findById(authUser.userId);

    if (!memberAccount || !memberAccount.isActive) {
      return NextResponse.json(
        { success: false, message: '會員賬戶不存在或已被停用' },
        { status: 404 }
      );
    }

    // 檢查 quota 是否足夠
    const currentQuota = memberAccount.quota || 0;
    const price = qrCodeRecord.price;

    if (currentQuota < price) {
      return NextResponse.json(
        { 
          success: false, 
          message: '餘額不足',
          data: {
            currentQuota,
            requiredAmount: price,
            shortage: price - currentQuota
          }
        },
        { status: 400 }
      );
    }

    // 扣除 quota
    const newQuota = currentQuota - price;
    
    // 更新會員的 quota 和 usedTickets
    const currentUsedTickets = memberAccount.usedTickets || 0;
    memberAccount.quota = newQuota;
    memberAccount.usedTickets = currentUsedTickets + price;
    
    await memberAccount.save();

    // 清除相關緩存
    cache.delete('accounts_all');
    cache.delete('accounts_member');
    cache.delete(`accounts_${authUser.role}`);

    // 地區名稱映射
    const regionNames: Record<string, string> = {
      'WC': '灣仔',
      'WTS': '黃大仙',
      'SM': '石門'
    };

    // 返回成功信息
    return NextResponse.json({
      success: true,
      message: '扣款成功',
      data: {
        qrCode: {
          number: qrCodeRecord.qrCodeNumber,
          regionName: regionNames[qrCodeRecord.regionCode] || qrCodeRecord.regionCode,
          productDescription: qrCodeRecord.productDescription,
          price: qrCodeRecord.price,
        },
        transaction: {
          previousQuota: currentQuota,
          deductedAmount: price,
          newQuota: newQuota,
          memberName: memberAccount.memberName,
          transactionTime: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('處理 QR Code 扣款失敗:', error);
    return NextResponse.json(
      { success: false, message: '處理 QR Code 扣款失敗' },
      { status: 500 }
    );
  }
}

