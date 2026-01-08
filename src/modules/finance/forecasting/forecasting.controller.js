import { ok, badRequest, internal } from '../../../utils/apiResponse.js';
import ForecastingService from './forecasting.service.js';

export async function postRunForecast(req, res) {
  try {
    const { companyID } = req.auth;
    const opts = req.body || {};
    const data = await ForecastingService.runForecast(companyID, opts);
    return ok(res, data);
  } catch (err) {
    console.error('[ForecastingController] run-forecast error:', err);
    return internal(res, err.message || 'Error running forecast');
  }
}

export default { postRunForecast };
