import cron from 'node-cron';
import { exec } from 'child_process';
import path from 'path';
import logger from '../config/logger.config.js';
import dotenv from 'dotenv';

dotenv.config();

// Configure your backup folder
const backupDir = path.resolve('C:/db_backups'); // or wherever you want

// Run every day at 2:00 AM
cron.schedule('0 2 * * *', async () => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `erp_${timestamp}.sql`);

  try {
    logger.info('Running database backup job...');

    // Command to dump your "erp" database
    const cmd = `pg_dump -U ${process.env.DB_USER} -h ${process.env.DB_HOST} -p ${process.env.DB_PORT} -F c -b -v -f "${backupFile}" ${process.env.DB_NAME}`;

    exec(cmd, { env: { PGPASSWORD: process.env.DB_PASSWORD } }, (error, stdout, stderr) => {
      if (error) {
        logger.error('Backup job failed:', error);
        return;
      }
      logger.info(`Backup completed successfully: ${backupFile}`);
      console.log(stdout);
      console.error(stderr);
    });
  } catch (error) {
    logger.error('Backup job failed:', error);
  }
});
