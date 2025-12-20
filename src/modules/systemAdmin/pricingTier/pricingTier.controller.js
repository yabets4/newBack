import PricingTierService from "./pricingTier.service.js";

export default class PricingTierController {
  // GET /tiers → latest version of all tiers
  static async fetchAll(req, res) {
    try {
      const tiers = await PricingTierService.getAllTiers();
      return res.status(200).json(tiers);
    } catch (err) {
      console.error("Controller fetchAll error:", err);
      return res.status(500).json({ error: err.message });
    }
  }

  // GET /tiers/:tier_id → latest version of one tier
  static async fetchOne(req, res) {
    try {
      const { tier_id } = req.params;
      const tier = await PricingTierService.getTierById(tier_id);

      if (!tier) {
        return res.status(404).json({ error: "Tier not found" });
      }

      return res.status(200).json(tier);
    } catch (err) {
      console.error("Controller fetchOne error:", err);
      return res.status(500).json({ error: err.message });
    }
  }

  // POST /tiers → create new tier (with v1)
  static async create(req, res) {
    try {
      if (!req.body.name) {
        return res.status(400).json({ error: "Tier name is required" });
      }

      const tier = await PricingTierService.createTier(req.body);
      return res.status(201).json(tier);
    } catch (err) {
      console.error("Controller create error:", err);
      return res.status(500).json({ error: err.message });
    }
  }

  // PUT /tiers/:tier_id → create a new version for an existing tier
  static async update(req, res) {
    try {
      const { tier_id } = req.params;

      const exists = await PricingTierService.getTierById(tier_id);
      if (!exists) {
        return res.status(404).json({ error: "Tier not found" });
      }

      const tier = await PricingTierService.updateTier(tier_id, req.body);
      return res.status(200).json(tier);
    } catch (err) {
      console.error("Controller update error:", err);
      return res.status(500).json({ error: err.message });
    }
  }

  // DELETE /tiers/:tier_id → deletes tier and all versions
  static async delete(req, res) {
    try {
      const { tier_id } = req.params;

      const exists = await PricingTierService.getTierById(tier_id);
      if (!exists) {
        return res.status(404).json({ error: "Tier not found" });
      }

      await PricingTierService.deleteTier(tier_id);
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error("Controller delete error:", err);
      return res.status(500).json({ error: err.message });
    }
  }
}
