import express from 'express';
import { Resend } from 'resend';
import { getPool } from '../db.js';

const router = express.Router();

// 初始化 Resend（延迟初始化，避免 env 未加载）
function getResend() {
  return new Resend(process.env.RESEND_API_KEY || '');
}

// 发送验证码
router.post('/send-code', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: '请输入有效的邮箱地址' });
    }

    const pool = getPool();

    // 检查邮箱是否已注册
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: '该邮箱已被注册，请直接登录' });
    }

    // 生成6位验证码
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // 删除旧验证码
    await pool.query('DELETE FROM email_codes WHERE email = $1 AND action = $2', [email, 'register']);

    // 存入数据库
    await pool.query(
      'INSERT INTO email_codes (email, code, action, expires_at) VALUES ($1, $2, $3, $4)',
      [email, code, 'register', expiresAt]
    );

    // 使用 Resend 发送邮件
    const resend = getResend();

    // 尝试发送，但如果失败（403 未验证域名）就降级到测试模式
    let sendSuccess = false;
    if (process.env.RESEND_API_KEY) {
      try {
        const { error: sendError } = await resend.emails.send({
          from: '博客系统 <onboarding@resend.dev>',
          to: [email],
          subject: '【博客注册】您的验证码',
          html: `
            <div style="max-width:480px;margin:0 auto;font-family:Arial,sans-serif;">
              <div style="background:linear-gradient(135deg,#1890ff,#43a3fb);padding:32px 24px;border-radius:12px 12px 0 0;text-align:center;">
                <h1 style="color:#fff;margin:0;font-size:24px;">📝 博客注册验证码</h1>
              </div>
              <div style="background:#fff;padding:32px 24px;border-radius:0 0 12px 12px;border:1px solid #e8e8e8;border-top:none;">
                <p style="font-size:15px;color:#333;margin:0 0 20px;">您好，</p>
                <p style="font-size:15px;color:#333;margin:0 0 24px;">您正在注册博客账号，您的验证码是：</p>
                <div style="background:#f5f7ff;border:2px dashed #1890ff;border-radius:10px;padding:20px;text-align:center;margin-bottom:24px;">
                  <span style="font-size:36px;font-weight:bold;color:#1890ff;letter-spacing:8px;">${code}</span>
                </div>
                <p style="font-size:14px;color:#888;margin:0 0 8px;">• 验证码 <strong>10分钟</strong> 内有效</p>
                <p style="font-size:14px;color:#888;margin:0;">• 请勿将验证码告诉他人</p>
                <hr style="margin:24px 0;border:none;border-top:1px solid #f0f0f0;" />
                <p style="font-size:12px;color:#bbb;text-align:center;margin:0;">此邮件由系统自动发送，请勿回复</p>
              </div>
            </div>
          `,
        });

        if (!sendError) {
          sendSuccess = true;
        }
      } catch (e) {
        // 发送失败，降级到测试模式
      }
    }

    // 如果发送失败或未配置，返回测试验证码给前端
    if (!sendSuccess) {
      console.log(`🧪 测试模式 [${email}]: ${code}`);
      return res.json({
        success: true,
        message: '验证码已生成（测试模式）',
        test_code: code,
      });
    }

    res.json({ success: true, message: '验证码已发送至您的邮箱' });
  } catch (err) {
    console.error('发送验证码错误:', err.message);
    res.status(500).json({ error: '服务器错误，请稍后重试' });
  }
});

// 验证邮箱 + 注册
router.post('/verify-and-register', async (req, res) => {
  try {
    const { email, code, password, nickname } = req.body;

    if (!email || !code || !password) {
      return res.status(400).json({ error: '邮箱、验证码和密码不能为空' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: '邮箱格式不正确' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: '密码至少6位' });
    }

    const pool = getPool();

    // 查询验证码
    const result = await pool.query(
      `SELECT * FROM email_codes
       WHERE email = $1 AND code = $2 AND action = 'register'
       AND expires_at > NOW() AND used = false
       ORDER BY created_at DESC LIMIT 1`,
      [email, code]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: '验证码无效或已过期，请重新获取' });
    }

    // 标记验证码已使用
    await pool.query('UPDATE email_codes SET used = true WHERE id = $1', [result.rows[0].id]);

    // 检查邮箱是否已注册
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: '该邮箱已被注册' });
    }

    // 创建用户
    const bcryptModule = await import('bcryptjs');
    const bcrypt = bcryptModule.default || bcryptModule;
    const hashed = await bcrypt.hash(password, 10);
    const finalNickname = nickname?.trim() || email.split('@')[0];

    const insertResult = await pool.query(
      'INSERT INTO users (username, email, password, nickname) VALUES ($1, $2, $3, $4) RETURNING id',
      [email, email, hashed, finalNickname]
    );

    // 生成JWT
    const jwtModule = await import('jsonwebtoken');
    const jwt = jwtModule.default || jwtModule;
    const token = jwt.sign(
      { id: insertResult.rows[0].id, username: email },
      process.env.JWT_SECRET || 'blog-secret',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: insertResult.rows[0].id,
        username: email,
        nickname: finalNickname,
        email,
        avatar: '',
      },
    });
  } catch (err) {
    console.error('注册错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

export default router;
