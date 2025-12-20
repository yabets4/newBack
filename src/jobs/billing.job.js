// src/jobs/billing.job.js
import cron from 'node-cron';
import logger from '../config/logger.config.js';

// Run every day at midnight
cron.schedule('0 0 * * *', async () => {
  try {
    logger.info('Running daily billing job...');
    // TODO: Add actual billing logic here
    console.log('Billing job executed');
  } catch (error) {
    logger.error('Billing job failed:', error);
  }
});
