import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Resend } from 'resend';

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'blog-jwt-secret-key-2024';

// Database pool - 使用 Transaction 模式（端口 6543）
let pool = null;
async function getDb() {
  if (!pool) {
    pool = new pg.Pool({
      host: process.env.DB_HOST || 'aws-1-ap-south-1.pooler.supabase.com',
      port: Number(process.env.DB_PORT) || 6543,
      user: process.env.DB_USER || 'postgres.otwnztyawygxcjnkzkku',
      password: process.env.DB_PASSWORD || 'UtdPwd123..',
      database: process.env.DB_NAME || 'postgres',
      max: 1,
      ssl: { rejectUnauthorized: false },
    });
  }
  return pool;
}

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Vercel serverless handler
export default async function handler(req, res) {
  return app(req, res);
}
