import { runForecast } from './montecarlo.service.js';

export const runMontecarlo = async (req, res, next) => {
  try {
    const params = req.body || {};
    // prefer company id from authenticated token (set by jwt.middleware)
    if (req.auth && req.auth.companyID) params.companyId = params.companyId || req.auth.companyID;
    // accept dateField from client but ensure it's passed through
    if (req.body && req.body.dateField) params.dateField = req.body.dateField;

    const result = await runForecast(params);
    res.json(result);
  } catch (err) {
    next(err);
  }
};
