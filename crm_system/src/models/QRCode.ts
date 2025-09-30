import mongoose, { Schema, Document } from 'mongoose';

export interface IQRCode extends Document {
  qrCodeNumber: string;         // 二维码编号 (格式: 0001-9999)
  regionCode: 'WC' | 'WTS' | 'SM';     // 地区编号
  regionName: 'WC' | 'WTS' | 'SM';     // 地区名称（对应中文）
  productDescription: '奶昔' | '跳舞';   // 产品描述
  price: number;                // 价格
  qrCodeData: string;           // 二维码的数据内容
  qrCodeImage?: string;         // 二维码图片的Base64编码或URL
  createdBy: string;            // 创建者的用户名
  isActive: boolean;            // 是否激活
  createdAt: Date;
  updatedAt: Date;
}

const QRCodeSchema: Schema = new Schema({
  qrCodeNumber: {
    type: String,
    required: [true, '请提供二维码编号'],
    unique: true,
    trim: true,
    match: [/^\d{4}$/, '二维码编号必须是4位数字']
  },
  regionCode: {
    type: String,
    enum: ['WC', 'WTS', 'SM'],
    required: [true, '请选择地区编号']
  },
  regionName: {
    type: String,
    enum: ['WC', 'WTS', 'SM'],
    required: [true, '请提供地区名称']
  },
  productDescription: {
    type: String,
    enum: ['奶昔', '跳舞'],
    required: [true, '请选择产品描述']
  },
  price: {
    type: Number,
    required: [true, '请提供价格'],
    min: [0, '价格不能为负数']
  },
  qrCodeData: {
    type: String,
    required: [true, '请提供二维码数据'],
    trim: true
  },
  qrCodeImage: {
    type: String,
    trim: true
  },
  createdBy: {
    type: String,
    required: [true, '请提供创建者'],
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

// 创建索引（qrCodeNumber 已通过 unique 自动创建）
QRCodeSchema.index({ regionCode: 1 });
QRCodeSchema.index({ createdBy: 1 });
QRCodeSchema.index({ createdAt: -1 });
QRCodeSchema.index({ isActive: 1 });

// 删除现有模型（如果存在）并重新创建
if (mongoose.models.QRCode) {
  delete mongoose.models.QRCode;
}

export default mongoose.model<IQRCode>('QRCode', QRCodeSchema);