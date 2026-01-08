import pool from './src/loaders/db.loader.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrate() {
    try {
        const sqlPath = path.join(__dirname, 'src', 'modules', 'notifications', 'telegram', 'telegram.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Running Telegram migration...');
        await pool.query(sql);
        console.log('Telegram migration completed successfully.');

        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
