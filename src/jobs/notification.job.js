import cron from 'node-cron';
import logger from '../config/logger.config.js';
import automationService from '../modules/notifications/telegram/automation.service.js';
import pool from '../loaders/db.loader.js';

// Run once a day at midnight
cron.schedule('0 0 * * *', async () => {
  logger.info('Telegram Automation Job: running...');
  try {
    const { rows: companies } = await pool.query('SELECT company_id FROM companies');
    for (const company of companies) {
      await automationService.runAutomation(company.company_id);
    }
  } catch (error) {
    logger.error('Telegram Automation Job failed:', error);
  }
  logger.info('Telegram Automation Job: done.');
});

cron.schedule('*/15 * * * *', async () => {
  logger.info('Notification job: running...');
  // scan ${tenant}_notifications to send pending items
  logger.info('Notification job: done.');
});
