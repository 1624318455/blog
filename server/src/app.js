import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initDb } from './db.js';
import authRoutes from './routes/auth.js';
import articleRoutes from './routes/articles.js';
import emailRoutes from './routes/email.js';

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    // Vercel 部署地址
    'https://blog-iuwpjyd0a-memeflyflys-projects.vercel.app',
  ],
  credentials: true,
}));
app.use(express.json());

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/email', emailRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 初始化数据库并启动
async function start() {
  try {
    await initDb();
    console.log('✅ 数据库初始化成功');

    app.listen(PORT, () => {
      console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ 启动失败:', err.message);
    process.exit(1);
  }
}

start();
