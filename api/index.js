import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Resend } from 'resend';

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'blog-secret';

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

// 健康检查
app.get('/api/health', async (req, res) => {
  try {
    const db = await getDb();
    const result = await db.query('SELECT NOW()');
    res.json({ 
      status: 'ok', 
      timestamp: result.rows[0].now,
      env: {
        DB_HOST: process.env.DB_HOST ? '✓' : '✗',
        DB_USER: process.env.DB_USER ? '✓' : '✗',
        DB_PASSWORD: process.env.DB_PASSWORD ? '✓' : '✗',
        DB_NAME: process.env.DB_NAME ? '✓' : '✗',
        JWT_SECRET: process.env.JWT_SECRET ? '✓' : '✗',
      }
    });
  } catch (err) {
    console.error('健康检查错误:', err.message);
    res.status(500).json({ 
      status: 'error', 
      error: err.message,
      env: {
        DB_HOST: process.env.DB_HOST ? '✓' : '✗',
        DB_USER: process.env.DB_USER ? '✓' : '✗',
        DB_PASSWORD: process.env.DB_PASSWORD ? '✓' : '✗',
        DB_NAME: process.env.DB_NAME ? '✓' : '✗',
      }
    });
  }
});

// CORS
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' })); // 增加 JSON 大小限制，支持大图片

// ============ IMAGE UPLOAD ROUTES ============

// 简单的图片上传 API（使用 Base64 存储）
app.post('/api/upload', requireAuth, async (req, res) => {
  try {
    const { file, type } = req.body;
    
    if (!file) {
      return res.status(400).json({ error: '请提供图片文件' });
    }

    // 验证 Base64 格式
    const matches = file.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ error: '图片格式不正确' });
    }

    const ext = matches[1]; // png, jpeg, jpg, webp
    const data = matches[2];
    
    // 验证文件大小（Base64 解码后应小于 5MB）
    const bufferSize = Buffer.from(data, 'base64').length;
    if (bufferSize > 5 * 1024 * 1024) {
      return res.status(400).json({ error: '图片大小不能超过 5MB' });
    }

    // 生成唯一文件名
    const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
    const key = `uploads/${type || 'general'}/${filename}`;
    
    // 由于 Supabase Storage 可能未配置，我们返回 Base64 URL 作为替代方案
    // 在生产环境中，建议配置 Supabase Storage
    const url = `data:image/${ext};base64,${data}`;
    
    console.log('✅ 图片上传成功:', { type, size: bufferSize, filename });
    res.json({ url, filename, key });
  } catch (err) {
    console.error('❌ 图片上传错误:', err);
    res.status(500).json({ error: '图片上传失败' });
  }
});

// ============ AUTH ROUTES ============

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, nickname } = req.body;
    if (!username || !password) return res.status(400).json({ error: '用户名和密码不能为空' });
    if (username.length < 3 || password.length < 6) return res.status(400).json({ error: '用户名至少3位，密码至少6位' });

    const db = await getDb();
    const existing = await db.query('SELECT id FROM users WHERE username = $1', [username]);
    if (existing.rows.length > 0) return res.status(409).json({ error: '用户名已存在' });

    const hashed = await bcrypt.hash(password, 10);
    const result = await db.query('INSERT INTO users (username, password, nickname) VALUES ($1, $2, $3) RETURNING id', [username, hashed, nickname || username]);
    const token = jwt.sign({ id: result.rows[0].id, username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, user: { id: result.rows[0].id, username, nickname: nickname || username } });
  } catch (err) {
    console.error('注册错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password, autoLogin } = req.body;
    if (!username || !password) return res.status(400).json({ error: '用户名和密码不能为空' });

    const db = await getDb();
    const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) return res.status(401).json({ error: '用户名或密码错误' });

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: '用户名或密码错误' });

    // 自动登录 30 天，否则 7 天
    const expiresIn = autoLogin ? '30d' : '7d';
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn });
    res.json({ success: true, token, user: { id: user.id, username: user.username, nickname: user.nickname, avatar: user.avatar, email: user.email, role: user.role || 'user' } });
  } catch (err) {
    console.error('登录错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

app.get('/api/auth/me', async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: '未登录' });

    const decoded = jwt.verify(auth.slice(7), JWT_SECRET);
    const db = await getDb();
    const result = await db.query('SELECT id, username, nickname, avatar, email, role, created_at FROM users WHERE id = $1', [decoded.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: '用户不存在' });
    res.json({ user: { ...result.rows[0], role: result.rows[0].role || 'user' } });
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') return res.status(401).json({ error: '登录已过期，请重新登录' });
    res.status(500).json({ error: '获取用户信息失败，请稍后重试' });
  }
});

app.put('/api/auth/profile', async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: '请先登录' });

    const decoded = jwt.verify(auth.slice(7), JWT_SECRET);
    const { nickname, avatar } = req.body;
    
    // 验证 avatar 大小（限制 500KB）
    if (avatar && avatar.length > 500 * 1024) {
      return res.status(400).json({ error: '头像图片太大，请选择更小的图片' });
    }
    
    const db = await getDb();
    
    // 更新用户资料
    const result = await db.query(
      'UPDATE users SET nickname = $1, avatar = $2 WHERE id = $3 RETURNING id',
      [nickname || '', avatar || '', decoded.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('❌ 更新个人资料错误:', {
      message: err.message,
      code: err.code,
      detail: err.detail,
      hint: err.hint,
      routine: err.routine,
    });
    res.status(500).json({ 
      error: '更新失败，请稍后重试',
      debug: { message: err.message, code: err.code }
    });
  }
});

// 获取用户详细资料（包含统计）
app.get('/api/auth/profile/detail', async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: '请先登录' });

    const decoded = jwt.verify(auth.slice(7), JWT_SECRET);
    const db = await getDb();
    
    const userResult = await db.query(
      'SELECT id, username, nickname, avatar, email, role, created_at FROM users WHERE id = $1',
      [decoded.id]
    );
    if (userResult.rows.length === 0) return res.status(404).json({ error: '用户不存在' });
    
    const user = userResult.rows[0];
    
    // 统计文章数
    const articleCount = await db.query('SELECT COUNT(*) as count FROM articles WHERE author_name = $1', [user.nickname || user.username]);
    // 统计评论数
    const commentCount = await db.query('SELECT COUNT(*) as count FROM comments WHERE user_id = $1', [user.id]);
    
    res.json({
      user: {
        ...user,
        role: user.role || 'user',
        article_count: parseInt(articleCount.rows[0].count) || 0,
        comment_count: parseInt(commentCount.rows[0].count) || 0,
      }
    });
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') return res.status(401).json({ error: '登录已过期，请重新登录' });
    res.status(500).json({ error: '获取用户信息失败，请稍后重试' });
  }
});

// ============ PUBLIC USER ROUTES ============

// 获取公开用户主页信息
app.get('/api/users/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const db = await getDb();
    
    // 通过昵称、用户名或邮箱查找用户
    const userResult = await db.query(
      `SELECT id, username, nickname, avatar, role, created_at FROM users 
       WHERE username = $1 OR nickname = $1 OR email = $1`,
      [username]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    const user = userResult.rows[0];
    
    // 统计该用户的文章数（通过 username 或 nickname 匹配）
    const articleCount = await db.query(
      `SELECT COUNT(*) as count FROM articles WHERE author_name = $1 OR author_name = $2`,
      [user.username, user.nickname]
    );
    
    // 获取该用户的文章列表（最新的 20 篇）
    const articlesResult = await db.query(
      `SELECT id, title, excerpt, tags, created_at, views 
       FROM articles 
       WHERE author_name = $1 OR author_name = $2
       ORDER BY created_at DESC 
       LIMIT 20`,
      [user.username, user.nickname]
    );
    
    res.json({
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        avatar: user.avatar,
        role: user.role || 'user',
        created_at: user.created_at,
        article_count: parseInt(articleCount.rows[0].count) || 0,
      },
      articles: articlesResult.rows.map(row => ({
        ...row,
        view_count: row.views,
        tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : (row.tags || [])
      }))
    });
  } catch (err) {
    console.error('获取用户主页错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 修改密码
app.put('/api/auth/password', async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: '请先登录' });

    const decoded = jwt.verify(auth.slice(7), JWT_SECRET);
    const { oldPassword, newPassword } = req.body;
    
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: '请填写完整信息' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: '新密码至少 6 位' });
    }
    
    const db = await getDb();
    const result = await db.query('SELECT password FROM users WHERE id = $1', [decoded.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: '用户不存在' });
    
    const user = result.rows[0];
    const valid = await bcrypt.compare(oldPassword, user.password);
    if (!valid) return res.status(400).json({ error: '当前密码错误' });
    
    const hashed = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, decoded.id]);
    
    res.json({ success: true });
  } catch (err) {
    console.error('修改密码错误:', err);
    res.status(500).json({ error: '修改失败，请稍后重试' });
  }
});

// ============ ARTICLE ROUTES ============

app.get('/api/articles', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword = '', tag = '' } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);
    const db = await getDb();

    let where = '1=1';
    const params = [];
    let idx = 1;

    if (keyword) {
      where += ` AND (title ILIKE $${idx} OR excerpt ILIKE $${idx})`;
      params.push(`%${keyword}%`);
      idx++;
    }
    if (tag) {
      where += ` AND tags::jsonb @> $${idx}::jsonb`;
      params.push(JSON.stringify([tag]));
      idx++;
    }

    const limitP = `$${idx}`; params.push(Number(pageSize)); idx++;
    const offsetP = `$${idx}`; params.push(offset);

    const result = await db.query(
      `SELECT id, title, excerpt, author_name, tags, views, created_at FROM articles WHERE ${where} ORDER BY created_at DESC LIMIT ${limitP} OFFSET ${offsetP}`,
      params
    );
    const countResult = await db.query(`SELECT COUNT(*) as total FROM articles WHERE ${where}`, params.slice(0, params.length - 2));

    const articles = result.rows.map(a => ({
      ...a,
      tags: typeof a.tags === 'string' ? JSON.parse(a.tags) : (a.tags || []),
    }));

    res.json({ articles, total: parseInt(countResult.rows[0].total), page: Number(page), pageSize: Number(pageSize) });
  } catch (err) {
    console.error('获取文章列表错误:', err);
    res.status(500).json({ error: '服务器错误', detail: err.message, stack: err.stack?.split('\n').slice(0,3) });
  }
});

app.get('/api/articles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const result = await db.query('SELECT * FROM articles WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: '文章不存在' });

    await db.query('UPDATE articles SET views = views + 1 WHERE id = $1', [id]);
    const article = result.rows[0];
    article.tags = typeof article.tags === 'string' ? JSON.parse(article.tags) : (article.tags || []);

    const comments = await db.query('SELECT * FROM comments WHERE article_id = $1 ORDER BY created_at DESC', [id]);
    res.json({ article, comments: comments.rows });
  } catch (err) {
    console.error('获取文章详情错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

app.post('/api/articles/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ error: '评论内容不能为空' });

    let userId = null, userName = '匿名';
    const auth = req.headers.authorization;
    if (auth && auth.startsWith('Bearer ')) {
      try {
        const decoded = jwt.verify(auth.slice(7), JWT_SECRET);
        userId = decoded.id;
        userName = decoded.username;
      } catch {}
    }

    const db = await getDb();
    const result = await db.query('INSERT INTO comments (article_id, user_id, user_name, content) VALUES ($1, $2, $3, $4) RETURNING id, created_at', [id, userId, userName, content.trim()]);
    res.json({ success: true, comment: { id: result.rows[0].id, article_id: Number(id), user_id: userId, user_name: userName, content: content.trim(), created_at: result.rows[0].created_at } });
  } catch (err) {
    console.error('发表评论错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// ============ EMAIL ROUTES ============

app.post('/api/email/send-code', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: '请输入有效的邮箱地址' });

    const db = await getDb();
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) return res.status(409).json({ error: '该邮箱已被注册，请直接登录' });

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await db.query('DELETE FROM email_codes WHERE email = $1 AND action = $2', [email, 'register']);
    await db.query('INSERT INTO email_codes (email, code, action, expires_at) VALUES ($1, $2, $3, $4)', [email, code, 'register', expiresAt]);

    let sendSuccess = false;
    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const { error: sendError } = await resend.emails.send({
          from: '博客系统 <onboarding@resend.dev>',
          to: [email],
          subject: '【博客注册】您的验证码',
          html: `<div style="max-width:480px;margin:0 auto;font-family:Arial,sans-serif;">
            <div style="background:linear-gradient(135deg,#1890ff,#43a3fb);padding:32px 24px;border-radius:12px 12px 0 0;text-align:center;">
              <h1 style="color:#fff;margin:0;font-size:24px;">📝 博客注册验证码</h1></div>
            <div style="background:#fff;padding:32px 24px;border-radius:0 0 12px 12px;border:1px solid #e8e8e8;border-top:none;">
              <p style="font-size:15px;color:#333;margin:0 0 20px;">您好，</p>
              <p style="font-size:15px;color:#333;margin:0 0 24px;">您正在注册博客账号，您的验证码是：</p>
              <div style="background:#f5f7ff;border:2px dashed #1890ff;border-radius:10px;padding:20px;text-align:center;margin-bottom:24px;">
                <span style="font-size:36px;font-weight:bold;color:#1890ff;letter-spacing:8px;">${code}</span></div>
              <p style="font-size:14px;color:#888;margin:0 0 8px;">• 验证码 <strong>10分钟</strong> 内有效</p>
              <p style="font-size:14px;color:#888;margin:0;">• 请勿将验证码告诉他人</p></div></div>`,
        });
        if (!sendError) sendSuccess = true;
      } catch {}
    }

    if (!sendSuccess) {
      console.log(`Test mode [${email}]: ${code}`);
      return res.json({ success: true, message: '验证码已生成（测试模式）', test_code: code });
    }
    res.json({ success: true, message: '验证码已发送至您的邮箱' });
  } catch (err) {
    console.error('发送验证码错误:', err.message);
    res.status(500).json({ error: '服务器错误，请稍后重试' });
  }
});

app.post('/api/email/verify-and-register', async (req, res) => {
  try {
    const { email, code, password, nickname } = req.body;
    if (!email || !code || !password) return res.status(400).json({ error: '邮箱、验证码和密码不能为空' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: '邮箱格式不正确' });
    if (password.length < 6) return res.status(400).json({ error: '密码至少6位' });

    const db = await getDb();
    const result = await db.query(
      `SELECT * FROM email_codes WHERE email = $1 AND code = $2 AND action = 'register' AND expires_at > NOW() AND used = false ORDER BY created_at DESC LIMIT 1`,
      [email, code]
    );
    if (result.rows.length === 0) return res.status(400).json({ error: '验证码无效或已过期，请重新获取' });

    await db.query('UPDATE email_codes SET used = true WHERE id = $1', [result.rows[0].id]);

    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) return res.status(409).json({ error: '该邮箱已被注册' });

    const hashed = await bcrypt.hash(password, 10);
    const finalNickname = nickname?.trim() || email.split('@')[0];

    const insertResult = await db.query('INSERT INTO users (username, email, password, nickname) VALUES ($1, $2, $3, $4) RETURNING id', [email, email, hashed, finalNickname]);
    const token = jwt.sign({ id: insertResult.rows[0].id, username: email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ success: true, token, user: { id: insertResult.rows[0].id, username: email, nickname: finalNickname, email, avatar: '' } });
  } catch (err) {
    console.error('注册错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// ============ AUTH MIDDLEWARE ============

async function requireAuth(req, res, next) {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: '未登录' });
    const decoded = jwt.verify(auth.slice(7), JWT_SECRET);
    const db = await getDb();
    const result = await db.query('SELECT id, username, nickname, role FROM users WHERE id = $1', [decoded.id]);
    if (result.rows.length === 0) return res.status(401).json({ error: '用户不存在' });
    req.user = result.rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token 无效或已过期' });
  }
}

// ============ ADMIN MIDDLEWARE ============

async function requireAdmin(req, res, next) {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: '未登录' });
    const decoded = jwt.verify(auth.slice(7), JWT_SECRET);
    const db = await getDb();
    const result = await db.query('SELECT id, username, nickname, role FROM users WHERE id = $1', [decoded.id]);
    if (result.rows.length === 0) return res.status(401).json({ error: '用户不存在' });
    if (result.rows[0].role !== 'admin') return res.status(403).json({ error: '无权限' });
    req.user = result.rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token 无效或已过期' });
  }
}

// ============ ADMIN ARTICLE ROUTES ============

// 获取所有文章（管理后台）
app.get('/api/admin/articles', requireAdmin, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, keyword = '' } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);
    const db = await getDb();

    let where = '1=1';
    const params = [];
    let idx = 1;
    if (keyword) {
      where += ` AND title ILIKE $${idx}`;
      params.push(`%${keyword}%`);
      idx++;
    }

    const limitP = `$${idx}`; params.push(Number(pageSize)); idx++;
    const offsetP = `$${idx}`; params.push(offset);

    const result = await db.query(
      `SELECT id, title, excerpt, author_name, tags, views, created_at FROM articles WHERE ${where} ORDER BY created_at DESC LIMIT ${limitP} OFFSET ${offsetP}`,
      params
    );
    const countResult = await db.query(`SELECT COUNT(*) as total FROM articles WHERE ${where}`, params.slice(0, params.length - 2));

    res.json({ articles: result.rows, total: parseInt(countResult.rows[0].total), page: Number(page), pageSize: Number(pageSize) });
  } catch (err) {
    console.error('获取文章列表错误:', err);
    res.status(500).json({ error: '服务器错误', detail: err.message });
  }
});

// 发布文章
app.post('/api/admin/articles', requireAdmin, async (req, res) => {
  try {
    const { title, content, excerpt, tags } = req.body;
    if (!title || !content) return res.status(400).json({ error: '标题和内容不能为空' });

    const db = await getDb();
    const result = await db.query(
      `INSERT INTO articles (title, content, excerpt, author_name, tags) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [title, content, excerpt || content.slice(0, 200), req.user.nickname || req.user.username, JSON.stringify(tags || [])]
    );
    res.json({ success: true, id: result.rows[0].id });
  } catch (err) {
    console.error('发布文章错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取单篇文章（编辑用）
app.get('/api/admin/articles/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const result = await db.query('SELECT * FROM articles WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: '文章不存在' });
    const article = result.rows[0];
    article.tags = typeof article.tags === 'string' ? JSON.parse(article.tags) : (article.tags || []);
    res.json({ article });
  } catch (err) {
    console.error('获取文章错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 编辑文章
app.put('/api/admin/articles/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, excerpt, tags } = req.body;
    
    console.log('📝 编辑文章请求:', { 
      id, 
      title: title?.slice(0, 30), 
      contentLength: content?.length,
      tagsCount: Array.isArray(tags) ? tags.length : 0,
      tagsType: typeof tags,
      tagsValue: JSON.stringify(tags).slice(0, 100)
    });
    
    if (!title || !content) {
      console.log('❌ 标题或内容为空');
      return res.status(400).json({ error: '标题和内容不能为空' });
    }
    if (!id || isNaN(Number(id))) {
      console.log('❌ ID 无效:', id);
      return res.status(400).json({ error: '文章 ID 无效' });
    }

    const db = await getDb();
    const tagsJson = Array.isArray(tags) ? JSON.stringify(tags) : JSON.stringify([]);
    
    console.log('🔄 执行 UPDATE 查询，参数:', {
      title: title?.slice(0, 20),
      contentLength: content?.length,
      excerpt: excerpt?.slice(0, 20),
      tagsJson: tagsJson.slice(0, 50),
      id: Number(id)
    });
    
    const result = await db.query(
      `UPDATE articles SET title = $1, content = $2, excerpt = $3, tags = $4::jsonb WHERE id = $5 RETURNING id`,
      [title, content, excerpt || content.slice(0, 200), tagsJson, Number(id)]
    );
    
    console.log('✅ UPDATE 完成，受影响行数:', result.rows.length);
    
    if (result.rows.length === 0) {
      console.log('❌ 文章不存在:', id);
      return res.status(404).json({ error: '文章不存在' });
    }
    
    res.json({ success: true });
  } catch (err) {
    const errorInfo = {
      message: err.message,
      code: err.code,
      detail: err.detail,
      hint: err.hint,
      position: err.position,
      name: err.name,
    };
    console.error('❌ 编辑文章错误:', JSON.stringify(errorInfo, null, 2));
    // 始终返回详细错误信息以便调试
    res.status(500).json({ 
      error: '服务器错误，请稍后重试',
      debug: errorInfo
    });
  }
});

// 删除文章
app.delete('/api/admin/articles/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    await db.query('DELETE FROM articles WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('删除文章错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Vercel serverless handler
export default async function handler(req, res) {
  return app(req, res);
}
