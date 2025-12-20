import fs from 'fs';
import path from 'path';
import pool from '../src/loaders/db.loader.js';

async function run() {
  try {
    const migrationsDir = path.join(new URL(import.meta.url).pathname, '..', '..', 'migrations');
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
    for (const file of files) {
      const fp = path.join(migrationsDir, file);
      const sql = fs.readFileSync(fp, 'utf8');
      console.log('Running', file);
      await pool.query(sql);
    }
    console.log('All migrations ran successfully');
    process.exit(0);
  } catch (err) {
    console.error('Migration run failed:', err);
    process.exit(1);
  }
}

run();
