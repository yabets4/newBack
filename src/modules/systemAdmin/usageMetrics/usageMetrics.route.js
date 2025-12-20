import { Router } from 'express';
import UsageMetricsController from './usageMetrics.controller.js';

const r = Router();

// Get user-specific usage metrics
r.get('/user/:userId/:companyId', UsageMetricsController.getUserMetrics);

// Get API route metrics
r.get('/routes', UsageMetricsController.getRouteMetrics);

// --- New: Get company-wide usage metrics ---
r.get('/company/:companyId', UsageMetricsController.getCompanyMetrics);

export default r;
