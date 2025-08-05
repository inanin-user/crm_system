import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IAccount extends Document {
  username: string;          // 用户名
  password: string;          // 密码 (加密后，用于验证)
  displayPassword: string;   // 明文密码 (用于管理界面显示)
  role: 'admin' | 'user' | 'trainer' | 'member';    // 角色：管理员、普通用户、教练、会员
  isActive: boolean;         // 账号是否激活
  lastLogin?: Date;          // 最后登录时间
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
    enum: ['admin', 'user', 'trainer', 'member'],
    default: 'user',
    required: [true, '请指定用户角色']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
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
  } catch (error: any) {
    next(error);
  }
});

// 比较密码的方法
AccountSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// 创建索引（username已经通过unique自动创建索引）
AccountSchema.index({ role: 1 });
AccountSchema.index({ isActive: 1 });

// 删除现有模型（如果存在）并重新创建
if (mongoose.models.Account) {
  delete mongoose.models.Account;
}

export default mongoose.model<IAccount>('Account', AccountSchema); 