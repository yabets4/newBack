import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../src/loaders/db.loader.js';

const arg = process.argv[2];
if (!arg) {
  console.error('Usage: node scripts/run_migration.js <sql-file-path>');
  process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Resolve the SQL file path robustly:
// 1. Absolute path -> use it
// 2. Relative to current working directory (where npm was run) -> use it if exists
// 3. Relative to this script's directory (scripts/) -> fallback
let fp;
if (path.isAbsolute(arg)) {
  fp = arg;
} else {
  const candCwd = path.resolve(process.cwd(), arg);
  if (fs.existsSync(candCwd)) {
    fp = candCwd;
  } else {
    fp = path.resolve(__dirname, arg);
  }
}

if (!fs.existsSync(fp)) {
  console.error('SQL file not found:', fp);
  process.exit(1);
}

const sql = fs.readFileSync(fp, 'utf8');
console.log('run_migration: starting — executing SQL file:', fp);
console.log('run_migration: DB host from env (masked):', process.env.DB_HOST ? `${process.env.DB_HOST}` : '<not-set>');

try {
  const result = await pool.query(sql);
  // Success summary
  if (result && typeof result.rowCount === 'number') {
    console.log(`run_migration: Success - ${result.rowCount} rows affected.`);
  } else if (result && result.command) {
    console.log(`run_migration: Success - command: ${result.command}`);
  } else {
    console.log('run_migration: Success - SQL executed.');
  }
  try { await pool.end(); } catch (e) { /* ignore close errors */ }
  process.exit(0);
} catch (err) {
  // Detailed error output for debugging
  console.error('run_migration: Failed to execute SQL.');
  if (err && err.message) console.error('Error message:', err.message);
  if (err && err.code) console.error('Error code:', err.code);
  if (err && err.position) console.error('Error position:', err.position);
  if (err && err.stack) console.error('Stack:', err.stack);
  try { await pool.end(); } catch (e) { /* ignore close errors */ }
  process.exit(1);
}
