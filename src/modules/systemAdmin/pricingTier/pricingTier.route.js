import { Router } from 'express';
import PricingTierController from './pricingTier.controller.js';
import permission from '../../../middleware/permission.middleware.js';

const r = Router();

r.get("/", PricingTierController.fetchAll);

// GET latest version of a tier by tier_id
r.get("/:tier_id", PricingTierController.fetchOne);

// CREATE new tier
r.post("/", PricingTierController.create);

// “UPDATE” a tier (actually inserts new row with same tier_id)
r.put("/:tier_id", PricingTierController.update);

// DELETE all versions of a tier
r.delete("/:tier_id", PricingTierController.delete);

export default r