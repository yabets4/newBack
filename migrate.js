import { exec } from 'child_process';
import path from 'path';

const SCHEMA_PATH = path.resolve(process.cwd(), 'db/schema.sql');
const DB_NAME = 'new'; // replace with your dev DB

exec(`pg_dump --schema-only --no-owner --no-privileges -d ${DB_NAME} -f "${SCHEMA_PATH}"`, (err, stdout, stderr) => {
  if (err) {
    console.error('❌ Failed to dump schema:', err);
    return;
  }
  console.log('✅ schema.sql written successfully.');
});
