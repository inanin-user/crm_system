import mongoose, { Schema, Document } from 'mongoose';

export interface IQRCode extends Document {
  qrCodeNumber: string;         // 二維碼編號 (格式: 0001-9999)
  regionCode: 'WC' | 'WTS' | 'SM';     // 地區編號
  regionName: 'WC' | 'WTS' | 'SM';     // 地區名稱（對應中文）
  productDescription: string;   // 產品描述（允許自定義）
  price: number;                // 價格
  qrCodeData: string;           // 二維碼的數據內容
  qrCodeImage?: string;         // 二維碼圖片的Base64編碼或URL
  createdBy: string;            // 創建者的用戶名
  isActive: boolean;            // 是否激活
  createdAt: Date;
  updatedAt: Date;
}

const QRCodeSchema: Schema = new Schema({
  qrCodeNumber: {
    type: String,
    required: [true, '請提供二維碼編號'],
    unique: true,
    trim: true,
    match: [/^\d{4}$/, '二維碼編號必須是4位數字']
  },
  regionCode: {
    type: String,
    enum: ['WC', 'WTS', 'SM'],
    required: [true, '請選擇地區編號']
  },
  regionName: {
    type: String,
    enum: ['WC', 'WTS', 'SM'],
    required: [true, '請提供地區名稱']
  },
  productDescription: {
    type: String,
    required: [true, '請提供產品描述'],
    trim: true,
    maxlength: [100, '產品描述不能超過100個字符']
  },
  price: {
    type: Number,
    required: [true, '請提供價格'],
    min: [0, '價格不能為負數']
  },
  qrCodeData: {
    type: String,
    required: [true, '請提供二維碼數據'],
    trim: true
  },
  qrCodeImage: {
    type: String,
    trim: true
  },
  createdBy: {
    type: String,
    required: [true, '請提供創建者'],
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'qrcodes'
});

// 創建索引（qrCodeNumber 已通過 unique 自動創建）
QRCodeSchema.index({ regionCode: 1 });
QRCodeSchema.index({ createdBy: 1 });
QRCodeSchema.index({ createdAt: -1 });
QRCodeSchema.index({ isActive: 1 });

// 刪除現有模型（如果存在）並重新創建
if (mongoose.models.QRCode) {
  delete mongoose.models.QRCode;
}

export default mongoose.model<IQRCode>('QRCode', QRCodeSchema);