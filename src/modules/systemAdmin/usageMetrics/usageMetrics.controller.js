import service from './usageMetrics.service.js';
import { ok, notFound } from '../../../utils/apiResponse.js';

export default class UsageMetricsController {
  // Get user metrics
  static async getUserMetrics(req, res, next) {
    try {
      const { userId, companyId } = req.params;
      const data = await service.getUserMetrics(userId, companyId);
      if (!data) return notFound(res, 'No metrics found for this user/company');
      return ok(res, data);
    } catch (e) {
      next(e);
    }
  }

  // Get route metrics
  static async getRouteMetrics(req, res, next) {
    try {
      const data = await service.getRouteMetrics();
      return ok(res, data);
    } catch (e) {
      next(e);
    }
  }

  // --- New: Get metrics per company ---
  static async getCompanyMetrics(req, res, next) {
    try {
      const { companyId } = req.params;
      if (!companyId) return notFound(res, 'Company ID is required');
      const data = await service.getCompanyUsageMetrics(companyId);
      return ok(res, data);
    } catch (e) {
      next(e);
    }
  }
}
