import pool from '../src/loaders/db.loader.js';

async function run() {
    const client = await pool.connect();
    try {
        console.log('Adding columns to journal_entries...');
        await client.query(`ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS source_module VARCHAR(50);`);
        await client.query(`ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS source_ref_id VARCHAR(50);`);
        console.log('Done.');
    } catch (err) {
        console.error(err);
    } finally {
        client.release();
        process.exit();
    }
}
run();
