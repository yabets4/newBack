import { Router } from 'express';

import auth from '../../middleware/auth.middleware.js';
import { authenticateJWT } from '../../middleware/jwt.middleware.js';
import { requestCounter } from '../../middleware/requestCounter.middleware.js';
import { CheckCompanyStatus } from '../../middleware/checkTierLimit.middleware.js';

import ProductRoutes from './product/product.routes.js';
import DesignRoutes from './design/design.routes.js';
import BOMRoutes from './bom/bom.routes.js';



const r = Router();
r.use(auth(false), authenticateJWT, CheckCompanyStatus, requestCounter);
//------ Product Routes -------
r.use('/products', ProductRoutes);
//------ Design Routes -------
r.use('/designs', DesignRoutes);
//------ BOM Routes -------
r.use('/boms', BOMRoutes);

export default r;