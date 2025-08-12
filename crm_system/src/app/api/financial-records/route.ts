import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import FinancialRecord from '@/models/FinancialRecord';

// 獲取所有財務記錄
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const memberName = searchParams.get('memberName');
    const recordType = searchParams.get('recordType');
    const location = searchParams.get('location');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    // 構建查詢條件
    const query: Record<string, unknown> = {};
    if (memberName) {
      query.memberName = { $regex: memberName, $options: 'i' };
    }
    if (recordType) {
      query.recordType = recordType;
    }
    if (location) {
      query.location = location;
    }
    
    // 計算跳過數量
    const skip = (page - 1) * limit;
    
    // 執行查詢 - 移除 populate 避免錯誤
    const records = await FinancialRecord.find(query)
      .sort({ recordDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // 手動處理 createdBy 字段
    const recordsWithUser = records.map(record => {
      const recordObj = record.toObject();
      return {
        ...recordObj,
        createdBy: {
          username: '系統用戶' // 使用默認值
        }
      };
    });
    
    // 獲取總數
    const total = await FinancialRecord.countDocuments(query);
    
    // 計算統計數據
    const stats = await FinancialRecord.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalIncome: {
            $sum: {
              $cond: [{ $eq: ['$recordType', 'income'] }, '$totalAmount', 0]
            }
          },
          totalExpense: {
            $sum: {
              $cond: [{ $eq: ['$recordType', 'expense'] }, '$totalAmount', 0]
            }
          }
        }
      }
    ]);
    
    const totalIncome = stats[0]?.totalIncome || 0;
    const totalExpense = stats[0]?.totalExpense || 0;
    const netAmount = totalIncome - totalExpense;
    
    return NextResponse.json({
      success: true,
      data: {
        records: recordsWithUser,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        stats: {
          totalIncome,
          totalExpense,
          netAmount
        }
      }
    });
  } catch (error) {
    console.error('獲取財務記錄失敗:', error);
    return NextResponse.json(
      { success: false, message: '獲取財務記錄失敗' },
      { status: 500 }
    );
  }
}

// 創建新的財務記錄
export async function POST(request: NextRequest) {
  try {
    console.log('開始創建財務記錄...');
    
    await connectDB();
    console.log('數據庫連接成功');
    
    const body = await request.json();
    console.log('接收到的請求體:', body);
    
    const {
      recordType,
      memberName,
      item,
      details,
      location,
      unitPrice,
      quantity,
      recordDate,
      createdBy
    } = body;
    
    console.log('解析後的字段:', {
      recordType,
      memberName,
      item,
      details,
      location,
      unitPrice,
      quantity,
      recordDate,
      createdBy
    });
    
    // 驗證必填字段
    if (!recordType || !memberName || !item || !location || unitPrice === undefined || !quantity) {
      console.log('必填字段驗證失敗');
      return NextResponse.json(
        { success: false, message: '請填寫所有必填字段' },
        { status: 400 }
      );
    }
    
    // 驗證數值
    if (unitPrice < 0 || quantity < 1) {
      console.log('數值驗證失敗:', { unitPrice, quantity });
      return NextResponse.json(
        { success: false, message: '單價和數量必須為正數' },
        { status: 400 }
      );
    }
    
    // 驗證 createdBy 是否為有效的 ObjectId
    if (!createdBy || !/^[0-9a-fA-F]{24}$/.test(createdBy)) {
      console.log('createdBy 驗證失敗:', createdBy);
      return NextResponse.json(
        { success: false, message: '創建者ID無效' },
        { status: 400 }
      );
    }
    
    console.log('所有驗證通過，開始創建記錄...');
    
    // 創建新記錄
    const newRecord = new FinancialRecord({
      recordType,
      memberName,
      item,
      details,
      location,
      unitPrice,
      quantity,
      recordDate: recordDate ? new Date(recordDate) : new Date(),
      createdBy
    });
    
    console.log('記錄對象創建成功:', newRecord);
    
    await newRecord.save();
    console.log('記錄保存成功，ID:', newRecord._id);
    
    return NextResponse.json({
      success: true,
      message: '財務記錄創建成功',
      data: newRecord
    }, { status: 201 });
  } catch (error) {
    console.error('創建財務記錄失敗:', error);
    const errorMessage = error instanceof Error ? error.message : '未知錯誤';
    return NextResponse.json(
      { success: false, message: `創建財務記錄失敗: ${errorMessage}` },
      { status: 500 }
    );
  }
} 