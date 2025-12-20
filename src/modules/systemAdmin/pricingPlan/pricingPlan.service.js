import pool from '../../../loaders/db.loader.js';
import PricingPlanModel from './pricingPlan.model.js';

export default class PricingPlanService {

  // Create full plan (tier + features)
  static async createFullPlan(tierData, features=[]) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const tier = await PricingPlanModel.createTier(tierData);

      const createdFeatures = [];
      for (const f of features) {
        f.tier_id = tier.tier_id;
        const feat = await PricingPlanModel.createFeature(f);
        createdFeatures.push(feat);
      }

      await client.query('COMMIT');
      return { tier, features: createdFeatures };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // Get all full plans
  static async getAllFullPlans() {
    const tiers = await PricingPlanModel.fetchAllTiers();
    const plans = [];
    for (const tier of tiers) {
      const features = await PricingPlanModel.fetchFeaturesByTier(tier.tier_id);
      plans.push({ tier, features });
    }
    return plans;
  }

  // Get full plan by tier_id
  static async getFullPlanById(tier_id) {
    const tier = await PricingPlanModel.fetchTierById(tier_id);
    if (!tier) throw new Error('Tier not found');
    const features = await PricingPlanModel.fetchFeaturesByTier(tier_id);
    return { tier, features };
  }

  // Update full plan
  static async updateFullPlan(tier_id, tierData, features=[]) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update tier
      const updatedTier = await PricingPlanModel.updateTier(tier_id, tierData);

      // Fetch existing features
      const existingFeatures = await PricingPlanModel.fetchFeaturesByTier(tier_id);
      const existingIds = existingFeatures.map(f => f.feature_id);
      const inputIds = features.map(f => f.feature_id);

      // Delete removed features
      const toDelete = existingIds.filter(id => !inputIds.includes(id));
      for (const id of toDelete) await PricingPlanModel.deleteFeature(id);

      const updatedFeatures = [];
      for (const f of features) {
        f.tier_id = tier_id;
        if (existingIds.includes(f.feature_id)) {
          const updated = await PricingPlanModel.updateFeature(f.feature_id, f);
          updatedFeatures.push(updated);
        } else {
          const created = await PricingPlanModel.createFeature(f);
          updatedFeatures.push(created);
        }
      }

      await client.query('COMMIT');
      return { tier: updatedTier, features: updatedFeatures };

    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // Delete full plan
  static async deleteFullPlan(tier_id) {
    await PricingPlanModel.deleteTier(tier_id);
  }
}
