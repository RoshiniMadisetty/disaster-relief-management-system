import mysql from 'mysql2/promise';

// Credentials come from environment variables (.env.local), never hard-coded.
export const pool =
  globalThis._pool ??
  (globalThis._pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    dateStrings: true,
  }));

export async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

// Run several statements as one transaction (commit on success, rollback on error)
export async function tx(fn) {
  const c = await pool.getConnection();
  try {
    await c.beginTransaction();
    const result = await fn(c);
    await c.commit();
    return result;
  } catch (e) {
    await c.rollback();
    throw e;
  } finally {
    c.release();
  }
}

// Build a WHERE clause from [condition, value] pairs, skipping empty values
export function where(conds) {
  const used = conds.filter(([, v]) => v);
  return {
    sql: used.length ? 'WHERE ' + used.map(([c]) => c).join(' AND ') : '',
    params: used.map(([, v]) => v),
  };
}
