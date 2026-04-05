const { Pool } = require('pg');
const pool = new Pool({
  host: 'aws-1-ap-south-1.pooler.supabase.com',
  port: 6543,
  user: 'postgres.otwnztyawygxcjnkzkku',
  password: 'UtdPwd123..',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});
(async () => {
  // 查询所有文章
  const r = await pool.query("SELECT COUNT(*) as count FROM articles");
  console.log("文章总数:", r.rows[0].count);
  
  // 查询前几条文章
  const r2 = await pool.query("SELECT id, title, author_name FROM articles ORDER BY created_at DESC LIMIT 5");
  console.log("最近的文章:", JSON.stringify(r2.rows, null, 2));
  
  await pool.end();
})();
