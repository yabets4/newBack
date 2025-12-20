import { Router } from 'express';
import auth from '../../middleware/auth.middleware.js';
import permission from '../../middleware/permission.middleware.js';
import cntrl from './monitoring/monitoring.controller.js'
import MainController from './main/main.controller.js';
import companyProfile from './companyProfile/companyProfile.routes.js';
import DataMigration from './dataMigration/dataMigration.controller.js';
import CompanyController from './company/company.controller.js';
import PricingTier from './pricingTier/pricingTier.route.js';
import PricingFeatureController from './pricingFeature/pricingFeature.controller.js';
import PricingPlan from './pricingPlan/pricingPlan.routes.js';
import adminRoutes from './adminUser/adminUser.routes.js'
import UsageMetrics from './usageMetrics/usageMetrics.route.js'
import Location from './locations/locations.routes.js'
import Payment from './payments/payments.routes.js'
import { uploadCompanyProfile } from '../../middleware/multer.middleware.js';

const r = Router();
r.use(auth(true))

// Multer for files
const cpUpload = uploadCompanyProfile.fields([
  { name: 'companyLogo', maxCount: 1 },
  { name: 'tinDocument', maxCount: 1 },
  { name: 'businessLicense', maxCount: 1 },
  { name: 'tradeLicense', maxCount: 1 },
]);

// --- CRUD Endpoints ---

// Create a company (onboard)
r.post('/company-profiles', cpUpload, CompanyController.onboard);
r.get('/company-profiles', CompanyController.getAll);
r.get('/company-profiles/:company_id',  CompanyController.getOne);
r.put('/company-profiles/:company_id', cpUpload, CompanyController.update);
r.delete('/company-profiles/:company_id', permission('delete_company'), CompanyController.delete);

// CRUD Endpoints for pricing tiers
r.use('/pricing-tiers', PricingTier)

// Full Pricing Plan CRUD
r.use('/', PricingPlan)

// CRUD Endpoints for pricing features
r.post('/pricing-features', permission('create_pricing_feature'), PricingFeatureController.create);
r.get('/pricing-features', permission('read_pricing_feature'), PricingFeatureController.getAll);
r.get('/pricing-features/:feature_id', permission('read_pricing_feature'), PricingFeatureController.getOne);
r.put('/pricing-features/:feature_id', permission('update_pricing_feature'), PricingFeatureController.update);
r.delete('/pricing-features/:feature_id',  PricingFeatureController.delete);

//logo
r.get('/logo', MainController.getCompanyLogoByName);
r.post('/logo', MainController.update);

r.get('/system-health', cntrl.getSystemHealth)
r.get('/logs', cntrl.getLogs)

//
r.post('/export', DataMigration.exportCompanyData);

r.use('/', adminRoutes)
r.use('/companyProfile', companyProfile)
r.use('/usage', UsageMetrics)
r.use('/Payments', Payment)
r.use('/location', Location)

export default r;
