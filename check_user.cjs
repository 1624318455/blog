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
  const r = await pool.query("SELECT id, username, email, role FROM users WHERE username = 'memeflyfly'");
  console.log(JSON.stringify(r.rows, null, 2));
  await pool.end();
})();
