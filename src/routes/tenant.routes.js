import { Router } from 'express';
import productRoutes from '../modules/product/product.routes.js';
import crmRoutes from '../modules/crm/crm.routes.js';
import systemAdminRoutes from '../modules/systemAdmin/systemAdmin.routes.js';
import projectRoutes from '../modules/project/project.routes.js';
import inventoryRoutes from '../modules/inventory/inventory.routes.js';
import hrRoutes from '../modules/hr/hr.routes.js';
import financeRoutes from '../modules/finance/finance.routes.js';
//import procurementRoutes from '../modules/procurement/procurement.routes.js';
//import reportRoutes from '../modules/reports/report.routes.js';
//import notificationRoutes from '../modules/notifications/notification.routes.js';
import systemRoutes from '../modules/system/system.routes.js';


const r = Router();

r.use('/products', productRoutes);
r.use('/crm', crmRoutes);
r.use('/sa', systemAdminRoutes);
r.use('/system', systemRoutes);
r.use('/projects', projectRoutes);
r.use('/inventory', inventoryRoutes);
r.use('/hr', hrRoutes);
r.use('/finance', financeRoutes);
//r.use('/procurement', procurementRoutes);
//r.use('/reports', reportRoutes);
//r.use('/notifications', notificationRoutes);


export default r;
