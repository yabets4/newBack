import pool from '../../../loaders/db.loader.js';

export default class PricingPlanModel {

  // Create a tier
  static async createTier(tierData) {
    const query = `
      INSERT INTO pricing_tiers
      (tier_id, name, monthly_price, annual_price, included_users, overage_cost_per_user, storage_limit, support_level)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *;
    `;
    const values = [
      tierData.tier_id, tierData.name, tierData.monthly_price || 0, tierData.annual_price || 0,
      tierData.included_users || 1, tierData.overage_cost_per_user || 0, tierData.storage_limit || 0,
      tierData.support_level || 'Standard'
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Get all tiers
  static async fetchAllTiers() {
    const result = await pool.query('SELECT * FROM pricing_tiers ORDER BY created_at DESC');
    return result.rows;
  }

  // Get tier by id
  static async fetchTierById(tier_id) {
    const result = await pool.query('SELECT * FROM pricing_tiers WHERE tier_id=$1', [tier_id]);
    return result.rows[0];
  }

  // Update tier
  static async updateTier(tier_id, fields) {
    const setFields = [];
    const values = [];
    let idx = 1;

    for (const key in fields) {
      if (fields[key] !== undefined) {
        setFields.push(`${key}=$${idx}`);
        values.push(fields[key]);
        idx++;
      }
    }
    if (setFields.length === 0) return this.fetchTierById(tier_id);

    const query = `UPDATE pricing_tiers SET ${setFields.join(', ')}, updated_at=NOW() WHERE tier_id=$${idx} RETURNING *`;
    values.push(tier_id);
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Delete tier
  static async deleteTier(tier_id) {
    await pool.query('DELETE FROM pricing_tiers WHERE tier_id=$1', [tier_id]); // cascade deletes features
  }

  // Features CRUD
  static async createFeature(feature) {
    const query = `
      INSERT INTO pricing_features (feature_id, tier_id, name, enabled)
      VALUES ($1,$2,$3,$4) RETURNING *;
    `;
    const values = [feature.feature_id, feature.tier_id, feature.name, feature.enabled !== undefined ? feature.enabled : true];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async fetchFeaturesByTier(tier_id) {
    const result = await pool.query('SELECT * FROM pricing_features WHERE tier_id=$1 ORDER BY created_at ASC', [tier_id]);
    return result.rows;
  }

  static async fetchFeatureById(feature_id) {
    const result = await pool.query('SELECT * FROM pricing_features WHERE feature_id=$1', [feature_id]);
    return result.rows[0];
  }

  static async updateFeature(feature_id, fields) {
    const setFields = [];
    const values = [];
    let idx = 1;
    for (let key of ['name', 'enabled']) {
      if (fields[key] !== undefined) {
        setFields.push(`${key}=$${idx}`);
        values.push(fields[key]);
        idx++;
      }
    }
    if (setFields.length === 0) return this.fetchFeatureById(feature_id);

    const query = `UPDATE pricing_features SET ${setFields.join(', ')}, updated_at=NOW() WHERE feature_id=$${idx} RETURNING *`;
    values.push(feature_id);
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async deleteFeaturesNotIn(tier_id, featureIds) {
    await pool.query('DELETE FROM pricing_features WHERE tier_id=$1 AND feature_id != ALL($2::text[])', [tier_id, featureIds]);
  }

  static async deleteFeature(feature_id) {
    await pool.query('DELETE FROM pricing_features WHERE feature_id=$1', [feature_id]);
  }
}
