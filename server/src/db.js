import Database from 'better-sqlite3';
import { readFileSync, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const isVercel = process.env.VERCEL === '1';
const dataDir = isVercel ? '/tmp' : join(__dirname, '..', 'data');
const dbPath = process.env.SQLITE_PATH || join(dataDir, 'store.db');

export function openDb() {
  if (!isVercel && !existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }
  const db = new Database(dbPath);
  // WAL mode doesn't work well on some Vercel-like read-only or shared filesystems, 
  // but if we are in /tmp it should be fine. However, for maximum compatibility 
  // on Serverless, we might want to use journal_mode = DELETE.
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  return db;
}

export function migrate(db) {
  const sql = readFileSync(join(__dirname, 'schema.sql'), 'utf8');
  db.exec(sql);
}

/** Create tables if this is a new database (does not drop existing data). */
export function ensureSchema(db) {
  const row = db
    .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='products'`)
    .get();
  if (!row) migrate(db);
}
