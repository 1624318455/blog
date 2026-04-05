const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// 使用与 Vercel 相同的连接
const pool = new Pool({
  host: 'aws-1-ap-south-1.pooler.supabase.com',
  port: 6543,
  user: 'postgres.otwnztyawygxcjnkzkku',
  password: 'UtdPwd123..',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

(async () => {
  // 生成新密码hash
  const newHash = await bcrypt.hash('Memeflyfly123!', 10);
  console.log('新hash:', newHash);
  
  // 更新用户密码
  await pool.query("UPDATE users SET password = $1 WHERE username = 'memeflyfly'", [newHash]);
  console.log('密码已更新');
  
  // 验证
  const r = await pool.query("SELECT username, password FROM users WHERE username = 'memeflyfly'");
  console.log('用户:', JSON.stringify(r.rows, null, 2));
  
  // 测试验证
  const storedHash = r.rows[0].password;
  const valid = await bcrypt.compare('Memeflyfly123!', storedHash);
  console.log('密码验证结果:', valid);
  
  await pool.end();
})();
