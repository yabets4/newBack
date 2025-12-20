import pool from '../../../loaders/db.loader.js';

export default class PricingTierModel {
  // CREATE
  static async createPricingTier(data) {
    const query = `
      INSERT INTO pricing_tiers
      (tier_id, name, monthly_price, annual_price, included_users, overage_cost_per_user, storage_limit, support_level)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *;
    `;
    const values = [
      data.tier_id, data.name, data.monthly_price || 0, data.annual_price || 0,
      data.included_users || 1, data.overage_cost_per_user || 0, data.storage_limit || 0,
      data.support_level || 'Standard'
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // READ ALL
  static async fetchAllPricingTiers() {
    const result = await pool.query('SELECT * FROM pricing_tiers ORDER BY created_at DESC');
    return result.rows;
  }

  // READ ONE
  static async fetchPricingTierById(tier_id) {
    const result = await pool.query('SELECT * FROM pricing_tiers WHERE tier_id=$1', [tier_id]);
    return result.rows[0];
  }

  // UPDATE
  static async updatePricingTier(tier_id, data) {
    const setFields = [];
    const values = [];
    let idx = 1;

    for (let key in data) {
      if (data[key] !== undefined) {
        setFields.push(`${key}=$${idx}`);
        values.push(data[key]);
        idx++;
      }
    }

    const query = `
      UPDATE pricing_tiers
      SET ${setFields.join(', ')}, updated_at=NOW()
      WHERE tier_id=$${idx}
      RETURNING *;
    `;
    values.push(tier_id);
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // DELETE
  static async deletePricingTier(tier_id) {
    await pool.query('DELETE FROM pricing_tiers WHERE tier_id=$1', [tier_id]);
  }
}
