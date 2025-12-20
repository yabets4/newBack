import monitoringService from './monitoring.service.js';
import { ok, notFound } from '../../../utils/apiResponse.js';


export default {
    getLogs: async (req, res, next) => {
        try {
          const limit = parseInt(req.query.limit) || 50;
          const logs = await  monitoringService.fetchLogs(limit); // service/model call
          return ok(res, logs, 'Logs fetched successfully');
        } catch (e) {
          next(e); // pass to error middleware
        }
      },
    
      getSystemHealth: async (req, res, next) => {
        try {
          const data = await monitoringService.fetchSystemHealth();
          return ok(res, data, 'System health fetched successfully');
        } catch (e) {
          next(e);
        }
      },

}