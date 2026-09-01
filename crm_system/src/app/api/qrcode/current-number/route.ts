import { NextResponse } from 'next/server';
import { getCurrentSequence, padQRCodeNumber } from '@/types/qrCode';
import { db } from '@/lib/db';

// 获取当前二维码编号
export async function GET() {
  try {
    const currentSequence = await getCurrentSequence('qrcode_number');
    const nextNumber = currentSequence + 1;

    // 如果超过9999，重置为1
    const finalNumber = nextNumber > 99999 ? 1 : nextNumber;
    const qrCodeNumber = padQRCodeNumber(finalNumber);

    return NextResponse.json({
      success: true,
      data: {
        currentNumber: qrCodeNumber,
        sequence: finalNumber
      }
    });
  } catch (error) {
    console.error('獲取當前編號失敗:', error);
    return NextResponse.json(
      { success: false, message: '獲取當前編號失敗' },
      { status: 500 }
    );
  }
}