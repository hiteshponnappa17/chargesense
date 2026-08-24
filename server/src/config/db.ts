import mongoose from 'mongoose';
import { env } from './env';

mongoose.set('strictQuery', true);

let connected = false;

/**
 * Establish (or reuse) a single Mongoose connection to MongoDB.
 * Throws on failure so the caller can decide how to surface it — we never
 * silently fall back to mock data.
 */
export async function connectDatabase(uri: string = env.mongoUri): Promise<typeof mongoose> {
  if (connected) return mongoose;

  mongoose.connection.on('connected', () => {
    // eslint-disable-next-line no-console
    console.log('✅ MongoDB connected');
  });
  mongoose.connection.on('error', (err) => {
    // eslint-disable-next-line no-console
    console.error('❌ MongoDB connection error:', err.message);
  });
  mongoose.connection.on('disconnected', () => {
    // eslint-disable-next-line no-console
    console.warn('⚠️  MongoDB disconnected');
  });

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 8000,
  });

  connected = true;
  return mongoose;
}

export async function disconnectDatabase(): Promise<void> {
  if (!connected) return;
  await mongoose.disconnect();
  connected = false;
}
