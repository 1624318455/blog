import pg from 'pg';

let pool = null;

export async function initDb() {
  const config = {
    host: process.env.DB_HOST || 'db.otwnztyawygxcjnkzkku.supabase.co',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'postgres',
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  };

  // Supabase 需要 SSL
  if (process.env.DB_SSL !== 'false') {
    config.ssl = { rejectUnauthorized: false };
  }

  pool = new pg.Pool(config);

  // 测试连接
  const res = await pool.query('SELECT NOW()');
  console.log('✅ PostgreSQL 连接成功:', res.rows[0].now);

  console.log('✅ 数据库初始化完成');
}

export function getPool() {
  return pool;
}
