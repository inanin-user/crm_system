import mongoose from 'mongoose';

declare global {
  // eslint-disable-next-line no-var
  var mongoose: {
    conn: unknown | null;
    promise: Promise<unknown> | null;
  };
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10, // 最大連接池大小
      serverSelectionTimeoutMS: 5000, // 5秒超時
      socketTimeoutMS: 45000, // 45秒socket超時
      connectTimeoutMS: 10000, // 10秒連接超時
      maxIdleTimeMS: 30000, // 30秒最大空閒時間
    };

    cached.promise = mongoose.connect(process.env.MONGODB_URI, opts).then((mongoose) => {
      // 設置查詢默認選項
      mongoose.set('debug', false); // 生產環境關閉調試
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e: unknown) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB; 