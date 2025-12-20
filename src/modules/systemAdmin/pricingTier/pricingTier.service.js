import PricingTierModel from "./pricingTier.model.js";

export default class PricingTierService {
  static async createTier(data) {
    try {
      return await PricingTierModel.createPricingTier(data);
    } catch (err) {
      console.error("Error in PricingTierService.createTier:", err);
      throw err;
    }
  }

  static async getAllTiers() {
    try {
      return await PricingTierModel.fetchAllPricingTiers();
    } catch (err) {
      console.error("Error in PricingTierService.getAllTiers:", err);
      throw err;
    }
  }

  static async getTierById(tier_id) {
    try {
      return await PricingTierModel.fetchPricingTierById(tier_id);
    } catch (err) {
      console.error("Error in PricingTierService.getTierById:", err);
      throw err;
    }
  }

  static async updateTier(tier_id, data) {
    try {
      return await PricingTierModel.updatePricingTier(tier_id, data);
    } catch (err) {
      console.error("Error in PricingTierService.updateTier:", err);
      throw err;
    }
  }

  static async deleteTier(tier_id) {
    try {
      return await PricingTierModel.deletePricingTier(tier_id);
    } catch (err) {
      console.error("Error in PricingTierService.deleteTier:", err);
      throw err;
    }
  }
}
