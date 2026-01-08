import { Router } from 'express';
import { postRunForecast } from './forecasting.controller.js';

import permission from '../../../middleware/permission.middleware.js';

const r = Router();

const canCreate = permission(['finance.forecasting.create', 'finance.create']);

r.post('/run', canCreate, postRunForecast);

export default r;
