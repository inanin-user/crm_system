import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  memberId: mongoose.Types.ObjectId;      // 會員ID
  memberName: string;                      // 會員姓名
  qrCodeNumber: string;                    // 二維碼編號
  productDescription: string;              // 項目/產品描述
  region: string;                          // 地區
  quotaUsed: number;                       // 使用的quota數量
  previousQuota: number;                   // 交易前的quota
  newQuota: number;                        // 交易後的quota
  transactionDate: Date;                   // 交易日期
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema: Schema = new Schema({
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: [true, '請提供會員ID']
  },
  memberName: {
    type: String,
    required: [true, '請提供會員姓名'],
    trim: true
  },
  qrCodeNumber: {
    type: String,
    required: [true, '請提供二維碼編號'],
    trim: true
  },
  productDescription: {
    type: String,
    required: [true, '請提供產品描述'],
    trim: true
  },
  region: {
    type: String,
    required: [true, '請提供地區'],
    trim: true
  },
  quotaUsed: {
    type: Number,
    required: [true, '請提供使用的quota數量'],
    min: [0, 'quota使用量不能為負數']
  },
  previousQuota: {
    type: Number,
    required: [true, '請提供交易前的quota']
  },
  newQuota: {
    type: Number,
    required: [true, '請提供交易後的quota']
  },
  transactionDate: {
    type: Date,
    required: [true, '請提供交易日期'],
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'transactions'
});

// 創建索引
TransactionSchema.index({ memberId: 1, transactionDate: -1 });
TransactionSchema.index({ memberName: 1 });
TransactionSchema.index({ qrCodeNumber: 1 });
TransactionSchema.index({ region: 1 });
TransactionSchema.index({ productDescription: 1 });

// 刪除現有模型（如果存在）並重新創建
if (mongoose.models.Transaction) {
  delete mongoose.models.Transaction;
}

export default mongoose.model<ITransaction>('Transaction', TransactionSchema);

