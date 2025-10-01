import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IAccount extends Document {
  username: string;          // 用戶名
  password: string;          // 密碼 (加密後，用於驗證)
  displayPassword: string;   // 明文密碼 (用於管理界面顯示)
  role: 'admin' | 'user' | 'trainer' | 'member' | 'regular-member' | 'premium-member';    // 角色：管理員、普通用戶、教練、會員、普通會員、星級會員
  isActive: boolean;         // 賬號是否激活
  locations: string[];       // 地區權限：['灣仔', '黃大仙', '石門']
  lastLogin?: Date;          // 最後登錄時間
  
  // 会员专用字段
  memberName?: string;       // 会员真实姓名
  phone?: string;           // 电话号码
  herbalifePCNumber?: string; // 康寶萊PC/會員號碼
  joinDate?: Date;          // 入會日期
  trainerIntroducer?: string; // 教練介紹人 (必选)
  referrer?: string;        // 轉介人 (自由填写)
  quota?: number;           // 剩余配额 (將成為累計剩余套票)
  renewalCount?: number;    // 續卡次數

  // 新增套票相關字段
  initialTickets?: number;   // 初始套票次數 (創建時的配额)
  addedTickets?: number;     // 累計添加的套票次數 (續卡時增加的總和)
  usedTickets?: number;      // 已使用套票次數 (參加活動次數)
  
  createdAt: Date;
  updatedAt: Date;
  
  // 方法
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const AccountSchema: Schema = new Schema({
  username: {
    type: String,
    required: [true, '请提供用户名'],
    unique: true,
    trim: true,
    minLength: [3, '用户名至少需要3个字符'],
    maxLength: [50, '用户名不能超过50个字符']
  },
  password: {
    type: String,
    required: [true, '请提供密码'],
    minLength: [6, '密码至少需要6个字符']
  },
  displayPassword: {
    type: String,
    required: [true, '请提供显示密码'],
    minLength: [6, '密码至少需要6个字符']
  },
  role: {
    type: String,
    enum: ['admin', 'user', 'trainer', 'member', 'regular-member', 'premium-member'],
    default: 'user',
    required: [true, '请指定用户角色']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  locations: {
    type: [String],
    enum: ['灣仔', '黃大仙', '石門'],
    default: []
  },
  lastLogin: {
    type: Date
  },
  
  // 会员专用字段
  memberName: {
    type: String,
    required: function(this: IAccount) {
      return ['member', 'regular-member', 'premium-member'].includes(this.role);
    },
    trim: true,
    maxLength: [100, '会员姓名不能超过100个字符']
  },
  phone: {
    type: String,
    required: function(this: IAccount) {
      return ['member', 'regular-member', 'premium-member'].includes(this.role);
    },
    trim: true,
    maxLength: [20, '电话号码不能超过20个字符']
  },
  herbalifePCNumber: {
    type: String,
    required: function(this: IAccount) {
      return ['member', 'regular-member', 'premium-member'].includes(this.role);
    },
    trim: true,
    maxLength: [50, '康寶萊PC/會員號碼不能超过50个字符']
  },
  joinDate: {
    type: Date,
    required: function(this: IAccount) {
      return ['member', 'regular-member', 'premium-member'].includes(this.role);
    }
  },
  trainerIntroducer: {
    type: String,
    required: function(this: IAccount) {
      return ['member', 'regular-member', 'premium-member'].includes(this.role);
    },
    trim: true,
    maxLength: [100, '教練介紹人不能超过100个字符']
  },
  referrer: {
    type: String,
    trim: true,
    maxLength: [100, '轉介人不能超过100个字符']
  },
  quota: {
    type: Number,
    required: function(this: IAccount) {
      return ['member', 'regular-member', 'premium-member'].includes(this.role);
    },
    min: [0, '配额不能为负数'],
    default: 0
  },
  renewalCount: {
    type: Number,
    required: false, // 改為可選，因為現有記錄可能沒有這個字段
    min: [0, '續卡次數不能為負數'],
    default: 0
  },

  // 新增套票相關字段
  initialTickets: {
    type: Number,
    required: false,
    min: [0, '初始套票次數不能為負數'],
    default: 0
  },
  addedTickets: {
    type: Number,
    required: false,
    min: [0, '添加套票次數不能為負數'],
    default: 0
  },
  usedTickets: {
    type: Number,
    required: false,
    min: [0, '已使用套票次數不能為負數'],
    default: 0
  }
}, {
  timestamps: true, // 自动添加 createdAt 和 updatedAt
  collection: 'account management' // 使用指定的 collection 名称
});

// 密码加密中间件
AccountSchema.pre<IAccount>('save', async function(next) {
  // 只在密码被修改时才加密
  if (!this.isModified('password')) return next();
  
  try {
    // 保存明文密码到displayPassword字段（如果还没有设置的话）
    if (!this.displayPassword) {
      this.displayPassword = this.password as string;
    }
    
    // 加密password字段用于验证
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password as string, salt);
    next();
  } catch (error: unknown) {
    next(error instanceof Error ? error : new Error('Unknown error'));
  }
});

// 比较密码的方法
AccountSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// 创建索引（username已经通过unique自动创建索引）
AccountSchema.index({ role: 1 });
AccountSchema.index({ isActive: 1 });
AccountSchema.index({ memberName: 1 });
AccountSchema.index({ phone: 1 });
AccountSchema.index({ herbalifePCNumber: 1 });
AccountSchema.index({ trainerIntroducer: 1 });

// 删除现有模型（如果存在）并重新创建
if (mongoose.models.Account) {
  delete mongoose.models.Account;
}

export default mongoose.model<IAccount>('Account', AccountSchema); 