import UsageMetricsModel from './usageMetrics.model.js';

const model = new UsageMetricsModel();

export default {
  incrementUserRequest: (userId, companyId) =>
    model.incrementUserRequest(userId, companyId),

  incrementRouteRequest: (route, method) =>
    model.incrementRouteRequest(route, method),

  getUserMetrics: (userId, companyId) =>
    model.getUserMetrics(userId, companyId),

  getRouteMetrics: () => model.getRouteMetrics(),

  // --- New: Get metrics per company ---
  getCompanyUsageMetrics: (companyId) =>
    model.getCompanyUsageMetrics(companyId),
};
