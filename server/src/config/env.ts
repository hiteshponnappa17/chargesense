import dotenv from 'dotenv';

dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '5000', 10),
  mongoUri: required('MONGODB_URI', 'mongodb://127.0.0.1:27017/chargesense'),
  jwtSecret: required('JWT_SECRET', 'chargesense_dev_secret_do_not_use_in_prod'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  clientUrl: process.env.CLIENT_URL ?? 'http://localhost:5173',
  memoryDbPort: parseInt(process.env.MEMORY_DB_PORT ?? '27017', 10),
  memoryDbPath: process.env.MEMORY_DB_PATH ?? '.data/mongodb',
  isProd: (process.env.NODE_ENV ?? 'development') === 'production',
};

export type AppEnv = typeof env;
