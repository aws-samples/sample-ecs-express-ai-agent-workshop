// Apply the session table DDL (connect-pg-simple) using DATABASE_URL.
import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const dir = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(join(dir, 'session-table.sql'), 'utf8');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

try {
  await pool.query(sql);
  console.log('Session table OK');
} finally {
  await pool.end();
}
