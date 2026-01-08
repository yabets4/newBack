import { Router } from 'express';
import { postCompareBudget } from './variance.controller.js';

import permission from '../../../middleware/permission.middleware.js';

const r = Router();

const canCreate = permission(['finance.variance.create', 'finance.create']);

r.post('/compare', canCreate, postCompareBudget);

export default r;
