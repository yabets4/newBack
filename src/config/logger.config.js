import pino from 'pino';
import app from './app.config.js';
import monitoringService from '../modules/systemAdmin/monitoring/monitoring.service.js';

const logger = pino({
  level: app.logLevel,
  hooks: {
    logMethod(args, method) {
      const [msg, context] = args;
      const level = this.levelVal;

      // Map numeric Pino levels to string
      const levelMap = {
        10: 'DEBUG',
        20: 'INFO',
        30: 'WARN',
        40: 'ERROR',
      };

      const levelStr = levelMap[level] || 'INFO';

      // Fire-and-forget DB logging with error handling
      monitoringService
        .logToDB(levelStr, msg, typeof context === 'object' ? context : {})
        .catch(err => console.error('Failed to save log to DB:', err));

      return method.apply(this, args);
    },
  },
});

export default logger;
