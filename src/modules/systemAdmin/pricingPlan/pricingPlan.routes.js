import { Router } from 'express';
import PricingPlanController from './pricingPlan.controller.js';
import permission from '../../../middleware/permission.middleware.js';

const r = Router();

r.post('/pricing-plans', permission('create_pricing_plan'), PricingPlanController.createFullPlan);
r.get('/pricing-plans', permission('read_pricing_plan'), PricingPlanController.getAllFullPlans);
r.get('/pricing-plans/:tier_id', permission('read_pricing_plan'), PricingPlanController.getFullPlanById);
r.put('/pricing-plans/:tier_id', permission('update_pricing_plan'), PricingPlanController.updateFullPlan);
r.delete('/pricing-plans/:tier_id', permission('delete_pricing_plan'), PricingPlanController.deleteFullPlan);

export default r