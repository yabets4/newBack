import * as monitoringModel from './monitoring.model.js';
import si from 'systeminformation';

const monitoringService = {
  fetchSystemHealth: async () => {
    const cpu = await si.currentLoad(); // CurrentLoadData type
    return {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuLoad: [
        cpu.avgLoad ?? 0,       // 1-min average load
        cpu.currentLoad ?? 0,   // total current load %
        cpu.currentLoadUser ?? 0, // user CPU %
      ],
      timestamp: new Date().toISOString(),
    };
  },
  fetchLogs: async (limit = 50) => {
    try {
      return await monitoringModel.fetchLogs(limit);
    } catch (err) {
      throw new Error('Failed to fetch logs: ' + err.message);
    }
  },

  logToDB: async (level, message, context = {}) => {
    try {
      // Ensure context is stringified if DB expects JSON/text
      const logEntry = {
        level,
        message,
        context: JSON.stringify(context),
        timestamp: new Date().toISOString(),
      };
      return await monitoringModel.insertLog(logEntry);
    } catch (err) {
      console.error('Failed to log to DB:', err);
      // don't throw to prevent crashing if logging fails
      return null;
    }
  },
};

export default monitoringService;
