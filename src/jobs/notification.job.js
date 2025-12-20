import cron from 'node-cron';
import logger from '../config/logger.config.js';

cron.schedule('*/15 * * * *', async () => {
  logger.info('Notification job: running...');
  // scan ${tenant}_notifications to send pending items
  logger.info('Notification job: done.');
});
