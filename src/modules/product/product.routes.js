import { Router } from 'express';
import { requestCounter } from '../../middleware/requestCounter.middleware.js';
import { CheckCompanyStatus } from '../../middleware/checkTierLimit.middleware.js';

import ProductRoutes from './product/product.routes.js';
import DesignRoutes from './design/design.routes.js';
import BOMRoutes from './bom/bom.routes.js';
import CostingRoutes from './costing/costing.routes.js';
import AdvancedRoutes from './advanced/advanced.routes.js';

const r = Router();
r.use( CheckCompanyStatus, requestCounter);
//------ Product Routes -------
r.use('/products', ProductRoutes);
//------ Design Routes -------
r.use('/designs', DesignRoutes);
//------ BOM Routes -------
r.use('/boms', BOMRoutes);
r.use('/costing', CostingRoutes);
r.use('/advanced', AdvancedRoutes);

export default r;