import PricingFeatureService from './pricingFeature.service.js';

export default class PricingFeatureController {
  // CREATE
  static async create(req, res) {
    try {
      const data = req.body;
      const feature = await PricingFeatureService.createFeature(data);
      res.status(201).json(feature);
    } catch (err) {
      console.error(err);
      res.status(500).send(err.message || 'Failed to create pricing feature');
    }
  }

  // READ ALL
  static async getAll(req, res) {
    try {
      const features = await PricingFeatureService.getAllFeatures();
      res.status(200).json(features);
    } catch (err) {
      console.error(err);
      res.status(500).send(err.message || 'Failed to fetch pricing features');
    }
  }

  // READ ONE
  static async getOne(req, res) {
    try {
      const feature = await PricingFeatureService.getFeatureById(req.params.feature_id);
      res.status(200).json(feature);
    } catch (err) {
      console.error(err);
      res.status(500).send(err.message || 'Failed to fetch pricing feature');
    }
  }

  // UPDATE
  static async update(req, res) {
    try {
      const data = req.body;
      const updated = await PricingFeatureService.updateFeature(req.params.feature_id, data);
      res.status(200).json(updated);
    } catch (err) {
      console.error(err);
      res.status(500).send(err.message || 'Failed to update pricing feature');
    }
  }

  // DELETE
  static async delete(req, res) {
    try {
      await PricingFeatureService.deleteFeature(req.params.feature_id);
      res.status(200).json({ message: 'Pricing feature deleted successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).send(err.message || 'Failed to delete pricing feature');
    }
  }
}
