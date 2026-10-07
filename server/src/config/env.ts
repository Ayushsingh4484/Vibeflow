import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const ENV = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db',
  JWT_SECRET: process.env.JWT_SECRET || 'vibeflow_super_secret_jwt_key_2026_production_grade',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  STORAGE_TYPE: process.env.STORAGE_TYPE || 'local',
  STORAGE_BASE_URL: process.env.STORAGE_BASE_URL || `http://localhost:${process.env.PORT || 5000}/uploads`,
  STORAGE_URL: process.env.STORAGE_URL || '',
  STORAGE_KEY: process.env.STORAGE_KEY || '',
  STORAGE_SECRET: process.env.STORAGE_SECRET || '',
  JAMENDO_CLIENT_ID: process.env.JAMENDO_CLIENT_ID || '',
};
