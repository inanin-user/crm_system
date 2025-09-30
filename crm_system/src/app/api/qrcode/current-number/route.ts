import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Counter from '@/models/Counter';

// 获取当前二维码编号
export async function GET() {
  try {
    await connectDB();

    const currentSequence = await Counter.getCurrentSequence('qrcode_number');
    const nextNumber = currentSequence + 1;

    // 如果超过9999，重置为1
    const finalNumber = nextNumber > 9999 ? 1 : nextNumber;
    const qrCodeNumber = finalNumber.toString().padStart(4, '0');

    return NextResponse.json({
      success: true,
      data: {
        currentNumber: qrCodeNumber,
        sequence: finalNumber
      }
    });
  } catch (error) {
    console.error('获取当前编号失败:', error);
    return NextResponse.json(
      { success: false, message: '获取当前编号失败' },
      { status: 500 }
    );
  }
}