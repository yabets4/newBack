import { runForecast } from './montecarlo.service.js';

/**
 * Controller to trigger the Monte Carlo Simulation.
 * Handles input extraction and validation before passing to the service.
 */
export const runMontecarlo = async (req, res, next) => {
  try {
    const params = req.body || {};

    // 1. Mandatory Company Identification (Auth Layer)
    const companyId = req.auth?.companyID || req.params?.companyId || params.companyId;
    if (!companyId) {
      return res.status(401).json({ error: 'Company identification required for simulation context.' });
    }
    params.companyId = companyId;

    // 2. Temporal Bound Normalization
    if (!params.startDate) params.startDate = new Date().toISOString().split('T')[0];
    if (!params.endDate) {
      const d = new Date(params.startDate);
      d.setDate(d.getDate() + 30); // Default 30-day horizon
      params.endDate = d.toISOString().split('T')[0];
    }

    // 3. Iteration Scalability
    params.simulationCount = Math.min(10000, Math.max(100, Number(params.simulationCount) || 2000));

    console.log(`[montecarlo:controller] triggering simulation for company=${companyId} horizon=${params.startDate} to ${params.endDate}`);

    const result = await runForecast(params);
    res.json(result);
  } catch (err) {
    console.error(`[montecarlo:controller] simulation failure:`, err);
    next(err);
  }
};