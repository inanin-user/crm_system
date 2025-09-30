import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import QRCode from '@/models/QRCode';

// 处理二维码扫描
export async function POST(request: NextRequest) {
  try {
    const { qrCodeData } = await request.json();

    if (!qrCodeData) {
      return NextResponse.json(
        { success: false, message: '请提供二维码数据' },
        { status: 400 }
      );
    }

    let parsedData;
    try {
      parsedData = JSON.parse(qrCodeData);
    } catch (parseError) {
      return NextResponse.json(
        { success: false, message: '二维码数据格式错误' },
        { status: 400 }
      );
    }

    const { number } = parsedData;

    if (!number) {
      return NextResponse.json(
        { success: false, message: '二维码数据缺少编号信息' },
        { status: 400 }
      );
    }

    await connectDB();

    // 查找对应的二维码记录
    const qrCodeRecord = await QRCode.findOne({
      qrCodeNumber: number,
      isActive: true
    }).lean();

    if (!qrCodeRecord) {
      return NextResponse.json(
        { success: false, message: '未找到对应的二维码记录' },
        { status: 404 }
      );
    }

    // 地区名称映射
    const regionNames: Record<string, string> = {
      'WC': '灣仔',
      'WTS': '黃大仙',
      'SM': '石門'
    };

    // 返回格式化的显示数据
    const displayData = {
      number: qrCodeRecord.qrCodeNumber,
      regionName: regionNames[qrCodeRecord.regionCode] || qrCodeRecord.regionCode,
      productDescription: qrCodeRecord.productDescription,
      price: qrCodeRecord.price,
      formattedDisplay: {
        line1: `地區：${regionNames[qrCodeRecord.regionCode] || qrCodeRecord.regionCode}`,
        line2: `${qrCodeRecord.productDescription}：$${qrCodeRecord.price}`
      },
      createdAt: qrCodeRecord.createdAt
    };

    return NextResponse.json({
      success: true,
      data: displayData
    });
  } catch (error) {
    console.error('处理二维码扫描失败:', error);
    return NextResponse.json(
      { success: false, message: '处理二维码扫描失败' },
      { status: 500 }
    );
  }
}