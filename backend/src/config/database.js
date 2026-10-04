import mongoose from 'mongoose';

export function dataSource() {
  return String(process.env.DATA_SOURCE || 'memory').toLowerCase();
}

export async function connectDatabase() {
  if (dataSource() !== 'mongodb') return null;

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sentinelnet';
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || 5000)
  });

  console.log(`SentinelNet MongoDB connected: ${mongoose.connection.name}`);
  return mongoose.connection;
}

export async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}
