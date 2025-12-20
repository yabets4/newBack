import PricingFeatureModel from './pricingFeature.model.js';

export default class PricingFeatureService {
  static async createFeature(data) {
    return PricingFeatureModel.createFeature(data);
  }

  static async getAllFeatures() {
    return PricingFeatureModel.fetchAllFeatures();
  }

  static async getFeatureById(feature_id) {
    return PricingFeatureModel.fetchFeatureById(feature_id);
  }

  static async updateFeature(feature_id, data) {
    return PricingFeatureModel.updateFeature(feature_id, data);
  }

  static async deleteFeature(feature_id) {
    return PricingFeatureModel.deleteFeature(feature_id);
  }
}
