import mongoose, { Schema, Document } from 'mongoose';

export interface ICounter extends Document {
  _id: string;                  // 计数器名称（例如: 'qrcode_number'）
  seq: number;                  // 当前序列号
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
    min: [0, '序列号不能为负数'],
    max: [9999, '序列号不能超过9999']
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

// 静态方法：获取下一个序列号
CounterSchema.statics.getNextSequence = async function(name: string): Promise<number> {
  const counter = await this.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  // 如果超过9999，重置为1
  if (counter.seq > 9999) {
    await this.findByIdAndUpdate(name, { seq: 1 });
    return 1;
  }

  return counter.seq;
};

// 静态方法：获取当前序列号（不增加）
CounterSchema.statics.getCurrentSequence = async function(name: string): Promise<number> {
  const counter = await this.findById(name);
  return counter ? counter.seq : 0;
};

// 删除现有模型（如果存在）并重新创建
if (mongoose.models.Counter) {
  delete mongoose.models.Counter;
}

export default mongoose.model<ICounter, ICounterModel>('Counter', CounterSchema);