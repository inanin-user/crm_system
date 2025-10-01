import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import QRCode from '@/models/QRCode';
import Counter from '@/models/Counter';
import cache from '@/lib/cache';

// 获取所有二维码记录
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const qrCodeNumber = searchParams.get('number');

    await connectDB();

    if (qrCodeNumber) {
      // 查询特定编号的二维码
      const qrCode = await QRCode.findOne({ qrCodeNumber }).lean();

      if (!qrCode) {
        return NextResponse.json(
          { success: false, message: '未找到指定的二维码记录' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: qrCode
      });
    }

    // 获取所有二维码记录
    const cacheKey = 'qrcodes_all';
    const cachedData = cache.get<unknown[]>(cacheKey);

    if (cachedData) {
      return NextResponse.json({
        success: true,
        data: cachedData,
        cached: true
      });
    }

    const qrCodes = await QRCode.find({ isActive: true })
      .sort({ createdAt: -1 })
      .lean();

    // 缓存结果（5分钟）
    cache.set(cacheKey, qrCodes, 5 * 60 * 1000);

    return NextResponse.json({
      success: true,
      data: qrCodes
    });
  } catch (error) {
    console.error('获取二维码记录失败:', error);
    return NextResponse.json(
      { success: false, message: '获取二维码记录失败' },
      { status: 500 }
    );
  }
}

// 创建新的二维码
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { regionCode, productDescription, price, createdBy } = body;

    console.log('收到二維碼創建請求:', body); // 調試信息

    // 验证必填字段
    if (!regionCode || !productDescription || price === undefined || !createdBy) {
      console.log('必填字段驗證失敗:', { regionCode, productDescription, price, createdBy });
      return NextResponse.json(
        { success: false, message: '地区编号、产品描述、价格和创建者都是必填项' },
        { status: 400 }
      );
    }

    // 验证价格
    if (typeof price !== 'number' || price < 0) {
      return NextResponse.json(
        { success: false, message: '价格必须是非负数' },
        { status: 400 }
      );
    }

    // 验证地区编号
    if (!['WC', 'WTS', 'SM'].includes(regionCode)) {
      return NextResponse.json(
        { success: false, message: '无效的地区编号' },
        { status: 400 }
      );
    }

    // 验证产品描述（允许自定义输入，只需要非空字符串）
    if (typeof productDescription !== 'string' || productDescription.trim().length === 0) {
      console.log('產品描述驗證失敗 - 空字符串:', productDescription);
      return NextResponse.json(
        { success: false, message: '产品描述不能为空' },
        { status: 400 }
      );
    }

    // 验证产品描述长度（防止过长）
    if (productDescription.length > 100) {
      console.log('產品描述驗證失敗 - 過長:', productDescription.length);
      return NextResponse.json(
        { success: false, message: '产品描述不能超过100个字符' },
        { status: 400 }
      );
    }

    console.log('所有驗證通過，準備創建二維碼');

    await connectDB();

    // 获取下一个编号
    const nextNumber = await Counter.getNextSequence('qrcode_number');
    const qrCodeNumber = nextNumber.toString().padStart(4, '0');

    // 构建二维码数据
    const regionNames: Record<string, string> = {
      'WC': '灣仔',
      'WTS': '黃大仙',
      'SM': '石門'
    };

    const qrCodeData = JSON.stringify({
      number: qrCodeNumber,
      regionCode,
      regionName: regionNames[regionCode],
      productDescription,
      price,
      timestamp: new Date().toISOString()
    });

    // 创建新的二维码记录
    const newQRCode = new QRCode({
      qrCodeNumber,
      regionCode,
      regionName: regionCode, // 保存地区编码
      productDescription,
      price,
      qrCodeData,
      createdBy,
      isActive: true
    });

    await newQRCode.save();

    // 清除缓存
    cache.delete('qrcodes_all');

    return NextResponse.json({
      success: true,
      message: '二维码创建成功',
      data: {
        _id: newQRCode._id,
        qrCodeNumber: newQRCode.qrCodeNumber,
        regionCode: newQRCode.regionCode,
        regionName: regionNames[newQRCode.regionCode],
        productDescription: newQRCode.productDescription,
        price: newQRCode.price,
        qrCodeData: newQRCode.qrCodeData,
        createdBy: newQRCode.createdBy,
        createdAt: newQRCode.createdAt
      }
    });
  } catch (error) {
    console.error('创建二维码失败:', error);
    return NextResponse.json(
      { success: false, message: '创建二维码失败' },
      { status: 500 }
    );
  }
}