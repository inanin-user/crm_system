import mongoose, { Schema, Document } from 'mongoose';

export interface ICounter extends Document {
  _id: string;                  // 計數器名稱（例如: 'qrcode_number'）
  seq: number;                  // 當前序列號
  createdAt: Date;
  updatedAt: Date;
}

const CounterSchema: Schema = new Schema({
  _id: {
    type: String,
    required: true
  },
  seq: {
    type: Number,
    required: true,
    default: 0,
    min: [0, '序列號不能為負數'],
    max: [9999, '序列號不能超過9999']
  }
}, {
  timestamps: true,
  collection: 'counters'
});

// 扩展模型接口以包含静态方法
interface ICounterModel extends mongoose.Model<ICounter> {
  getNextSequence(name: string): Promise<number>;
  getCurrentSequence(name: string): Promise<number>;
}

// 靜態方法：獲取下一個序列號
CounterSchema.statics.getNextSequence = async function(name: string): Promise<number> {
  const counter = await this.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  // 如果超過9999，重置為1
  if (counter.seq > 9999) {
    await this.findByIdAndUpdate(name, { seq: 1 });
    return 1;
  }

  return counter.seq;
};

// 靜態方法：獲取當前序列號（不增加）
CounterSchema.statics.getCurrentSequence = async function(name: string): Promise<number> {
  const counter = await this.findById(name);
  return counter ? counter.seq : 0;
};

// 刪除現有模型（如果存在）並重新創建
if (mongoose.models.Counter) {
  delete mongoose.models.Counter;
}

export default mongoose.model<ICounter, ICounterModel>('Counter', CounterSchema);