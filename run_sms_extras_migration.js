import pool from './src/loaders/db.loader.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
    try {
        const sqlPath = path.join(__dirname, 'src', 'modules', 'notifications', 'sms', 'sms_extras.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Running extras migration...');
        await pool.query(sql);
        console.log('Migration successful!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
