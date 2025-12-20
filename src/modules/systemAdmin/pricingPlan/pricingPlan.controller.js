import PricingPlanService from './pricingPlan.service.js';

export default class PricingPlanController {

  static async createFullPlan(req, res) {
    try {
      const { tier, features } = req.body;
      const plan = await PricingPlanService.createFullPlan(tier, features);
      res.status(201).json(plan);
    } catch (err) {
      console.error(err);
      res.status(500).send(err.message);
    }
  }

  static async getAllFullPlans(req, res) {
    try {
      const plans = await PricingPlanService.getAllFullPlans();
      res.status(200).json(plans);
    } catch (err) {
      console.error(err);
      res.status(500).send(err.message);
    }
  }

  static async getFullPlanById(req, res) {
    try {
      const plan = await PricingPlanService.getFullPlanById(req.params.tier_id);
      res.status(200).json(plan);
    } catch (err) {
      console.error(err);
      res.status(500).send(err.message);
    }
  }

  static async updateFullPlan(req, res) {
    try {
      const { tier, features } = req.body;
      const plan = await PricingPlanService.updateFullPlan(req.params.tier_id, tier, features);
      res.status(200).json(plan);
    } catch (err) {
      console.error(err);
      res.status(500).send(err.message);
    }
  }

  static async deleteFullPlan(req, res) {
    try {
      await PricingPlanService.deleteFullPlan(req.params.tier_id);
      res.status(200).json({ message: 'Deleted successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).send(err.message);
    }
  }
}
