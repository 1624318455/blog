import express from 'express';
import jwt from 'jsonwebtoken';
import { getPool } from '../db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'blog-secret';

// 通用中间件：可选认证（不强制登录）
function optionalAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(auth.slice(7), JWT_SECRET);
    } catch {
      // 忽略无效token
    }
  }
  next();
}

// 获取文章列表
router.get('/', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword = '', tag = '' } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);
    const pool = getPool();

    let where = '1=1';
    const params = [];
    let paramIdx = 1;

    if (keyword) {
      where += ` AND (title ILIKE $${paramIdx} OR excerpt ILIKE $${paramIdx})`;
      params.push(`%${keyword}%`);
      paramIdx++;
    }
    if (tag) {
      where += ` AND tags::jsonb @> $${paramIdx}::jsonb`;
      params.push(JSON.stringify([tag]));
      paramIdx++;
    }

    const limitParam = `$${paramIdx}`;
    params.push(Number(pageSize));
    paramIdx++;
    const offsetParam = `$${paramIdx}`;
    params.push(offset);

    const result = await pool.query(
      `SELECT id, title, excerpt, author_name, tags, views, created_at FROM articles WHERE ${where} ORDER BY created_at DESC LIMIT ${limitParam} OFFSET ${offsetParam}`,
      params
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM articles WHERE ${where}`,
      params.slice(0, params.length - 2)
    );

    // 解析 JSON 标签
    const articles = result.rows.map(a => ({
      ...a,
      tags: typeof a.tags === 'string' ? JSON.parse(a.tags) : (a.tags || []),
    }));

    res.json({
      articles,
      total: parseInt(countResult.rows[0].total),
      page: Number(page),
      pageSize: Number(pageSize),
    });
  } catch (err) {
    console.error('获取文章列表错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取文章详情
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = getPool();

    const result = await pool.query('SELECT * FROM articles WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '文章不存在' });
    }

    // 更新阅读量
    await pool.query('UPDATE articles SET views = views + 1 WHERE id = $1', [id]);

    const article = result.rows[0];
    article.tags = typeof article.tags === 'string' ? JSON.parse(article.tags) : (article.tags || []);

    // 获取评论
    const commentsResult = await pool.query(
      'SELECT * FROM comments WHERE article_id = $1 ORDER BY created_at DESC',
      [id]
    );

    res.json({ article, comments: commentsResult.rows });
  } catch (err) {
    console.error('获取文章详情错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 发表评论
router.post('/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: '评论内容不能为空' });
    }

    const auth = req.headers.authorization;
    let userId = null;
    let userName = '匿名';

    if (auth && auth.startsWith('Bearer ')) {
      try {
        const decoded = jwt.verify(auth.slice(7), JWT_SECRET);
        userId = decoded.id;
        userName = decoded.username;
      } catch {
        // 匿名评论
      }
    }

    const pool = getPool();
    const result = await pool.query(
      'INSERT INTO comments (article_id, user_id, user_name, content) VALUES ($1, $2, $3, $4) RETURNING id, created_at',
      [id, userId, userName, content.trim()]
    );

    res.json({
      success: true,
      comment: {
        id: result.rows[0].id,
        article_id: Number(id),
        user_id: userId,
        user_name: userName,
        content: content.trim(),
        created_at: result.rows[0].created_at,
      },
    });
  } catch (err) {
    console.error('发表评论错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

export default router;
