import { Router } from 'express';
import auth from '../../middleware/auth.middleware.js';
import permission from '../../middleware/permission.middleware.js';
import Leads from './lead/lead.routes.js'
import customer from './customer/customers.routes.js'
import Quote from './quote/quote.routes.js'
import Order from './order/order.routes.js'
import Report from './report/report.route.js'
import Location from './locations/locations.routes.js'
import { authenticateJWT } from '../../middleware/jwt.middleware.js';
import { requestCounter } from '../../middleware/requestCounter.middleware.js';
import {CheckCompanyStatus} from '../../middleware/checkTierLimit.middleware.js';


const r = Router(); 
r.use(auth(true), authenticateJWT, CheckCompanyStatus, requestCounter );
r.use('/orders', Order)

r.use('/customers', customer)
r.use('/locations', Location)

r.use('/quote', Quote)
r.use('/reports', Report)

// leads
r.use('/leads', Leads)

export default r;
