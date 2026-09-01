import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuid } from "uuid";
import cache from '@/lib/cache';
import { db } from '@/lib/db';
import { qrCodeRow, getNextSequence, padQRCodeNumber } from '@/types/qrCode';
import { getLocation, LocationCode } from '@/types/location';

// 获取所有QR Code记录
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const qrCodeNumber = searchParams.get('number');

    if (qrCodeNumber) {
      // 查询特定編號的QR Code
      const [rows] = await db.query<qrCodeRow[]>(
        `
        SELECT *
        FROM qrcodes
        WHERE qrCodeNumber = ?
        LIMIT 1
        `,
        [qrCodeNumber.trim()]
      );

      const qrCode = rows[0] ?? null;

      if (!qrCode) {
        return NextResponse.json(
          { success: false, message: '未找到QR Code記錄' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: qrCode
      });
    }

    // 获取所有QR Code记录
    const cacheKey = 'qrcodes_all';
    const cachedData = cache.get<unknown[]>(cacheKey);

    if (cachedData) {
      return NextResponse.json({
        success: true,
        data: cachedData,
        cached: true
      });
    }

    const [qrCodes] = await db.query<qrCodeRow[]>(
      `
      SELECT *
      FROM qrcodes
      WHERE isActive = TRUE
      ORDER BY createdAt DESC
      `
    );

    // 缓存结果（5分钟）
    cache.set(cacheKey, qrCodes, 5 * 60 * 1000);

    return NextResponse.json({
      success: true,
      data: qrCodes
    });
  } catch (error) {
    console.error('獲取QR Code失敗:', error);
    return NextResponse.json(
      { success: false, message: '獲取QR Code失敗' },
      { status: 500 }
    );
  }
}



// 整個新QR Code
export async function POST(request: NextRequest) {
  try {
    const { regionCode, productDescription, price, createdBy } = await request.json();
    
    // 验证必填字段
    if (!regionCode || !productDescription || price === undefined || !createdBy) {
      return NextResponse.json(
        { success: false, message: '要求字段: 地區編號、產品詳情、價格和建立者' },
        { status: 400 }
      );
    }

    // 验证價格
    if (typeof price !== 'number' || price < 0) {
      return NextResponse.json(
        { success: false, message: '價格必须是非负数' },
        { status: 400 }
      );
    }

    // 验证地區編號
    if (!Object.values(LocationCode).includes(regionCode)) {
      return NextResponse.json(
        { success: false, message: '无效的地區編號' },
        { status: 400 }
      );
    }

    // 验证產品詳情（允许自定义输入，只需要非空字符串）
    if (typeof productDescription !== 'string' || productDescription.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: '產品詳情不能为空' },
        { status: 400 }
      );
    }

    // 验证產品詳情长度（防止过长）
    if (productDescription.length > 100) {
      return NextResponse.json(
        { success: false, message: '產品詳情不能超过100个字符' },
        { status: 400 }
      );
    }
    // 获取下一个編號
    const nextNumber = await getNextSequence('qrcode_number');
    const qrCodeNumber = padQRCodeNumber(nextNumber);


    const { label } = await getLocation()

    const qrCodeData = JSON.stringify({
      number: qrCodeNumber,
      regionCode,
      regionName: regionCode,
      productDescription,
      price,
      timestamp: new Date().toISOString()
    });

    const id = uuid(); // generate UUID in TS

    await db.query(
      `
    INSERT INTO qrcodes (
      id,
      qrCodeNumber,
      regionCode,
      regionName,
      productDescription,
      price,
      qrCodeData,
      createdBy,
      isActive,
      createdAt,
      updatedAt
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE, NOW(), NOW());
    `,
      [
        id,
        qrCodeNumber,
        regionCode,
        regionCode,        // regionName stored same as regionCode
        productDescription,
        price,
        qrCodeData,
        createdBy
      ]
    );

    const [newRows] = await db.query<qrCodeRow[]>(
      `SELECT *
    FROM qrcodes
    WHERE id = ?
    `,
      [id]
    );
    const newQRCode = newRows[0];
    // 清除缓存
    cache.delete('qrcodes_all');

    return NextResponse.json({
      success: true,
      message: 'QR Code建立成功',
      data: {
        id: newQRCode.id,
        qrCodeNumber: newQRCode.qrCodeNumber,
        regionCode: newQRCode.regionCode,
        regionName: label(newQRCode.regionCode),
        productDescription: newQRCode.productDescription,
        price: newQRCode.price,
        qrCodeData: newQRCode.qrCodeData,
        createdBy: newQRCode.createdBy,
        createdAt: newQRCode.createdAt
      }
    });
  } catch (error) {
    console.error('建立QR Code失敗:', error);
    return NextResponse.json(
      { success: false, message: '建立QR Code失敗' },
      { status: 500 }
    );
  }
}