import { NextRequest, NextResponse } from 'next/server';
import { getLocation } from '@/types/location';
import { db } from '@/lib/db';
import { qrCodeRow } from '@/types/qrCode';

// 处理QR Code扫描
export async function POST(request: NextRequest) {
  try {
    const { qrCodeData } = await request.json();

    if (!qrCodeData) {
      return NextResponse.json(
        { success: false, message: '請提供QR Code數據' },
        { status: 400 }
      );
    }

    let parsedData;
    try {
      parsedData = JSON.parse(qrCodeData);
    } catch (parseError) {
      return NextResponse.json(
        { success: false, message: 'QR Code數據格式错误' },
        { status: 400 }
      );
    }

    const { number } = parsedData;

    if (!number) {
      return NextResponse.json(
        { success: false, message: 'QR Code數據缺少编号信息' },
        { status: 400 }
      );
    }

    const [rows] = await db.query<qrCodeRow[]>(
      `
      SELECT *
      FROM qrcodes
      WHERE qrCodeNumber = ?
        AND isActive = TRUE
      LIMIT 1
      `,
      [number.trim()]
    );

    const qrCodeRecord = rows[0] ?? null;

    if (!qrCodeRecord) {
      return NextResponse.json(
        { success: false, message: '未找到对应的QR Code記錄' },
        { status: 404 }
      );
    }
    const { label } = await getLocation();
    // 返回格式化的显示數據
    const displayData = {
      number: qrCodeRecord.qrCodeNumber,
      regionName: label(qrCodeRecord.regionCode) || qrCodeRecord.regionCode,
      productDescription: qrCodeRecord.productDescription,
      price: qrCodeRecord.price,
      formattedDisplay: {
        line1: `地區：${label(qrCodeRecord.regionCode) || qrCodeRecord.regionCode}`,
        line2: `${qrCodeRecord.productDescription}：$${qrCodeRecord.price}`
      },
      createdAt: qrCodeRecord.createdAt
    };

    return NextResponse.json({
      success: true,
      data: displayData
    });
  } catch (error) {
    console.error('处理QR Code扫描失败:', error);
    return NextResponse.json(
      { success: false, message: '处理QR Code扫描失败' },
      { status: 500 }
    );
  }
}