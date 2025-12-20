import pool from '../../../loaders/db.loader.js';

export default class PricingTierModel {
  // CREATE a new tier (with its first version)
  static async createPricingTier(data) {
    try {
      // Generate next tier_id
      const tierIdResult = await pool.query(`
        SELECT 'tier-' || LPAD(
          (COALESCE(MAX(CAST(SPLIT_PART(tier_id,'-',2) AS INT)), 0) + 1)::text,
          2,
          '0'
        ) AS next_tier_id
        FROM pricing_tiers
      `);
      const tier_id = tierIdResult.rows[0].next_tier_id;

      // Insert into pricing_tiers (identity)
      await pool.query(
        `INSERT INTO pricing_tiers (tier_id, name) VALUES ($1, $2)`,
        [tier_id, data.name]
      );

      // Insert first version
      const version = 1;
      const now = new Date();
      const result = await pool.query(
        `INSERT INTO pricing_tier_versions
          (tier_id, version, monthly_price, annual_price, included_users, total_customer, total_leads, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         RETURNING *`,
        [
          tier_id,
          version,
          data.monthly_price || 0,
          data.annual_price || 0,
          data.included_users || 1,
          data.total_customer || 0,
          data.total_leads || 0,
          now,
          now,
        ]
      );

      return { ...result.rows[0], name: data.name };
    } catch (err) {
      console.error('Error in createPricingTier:', err);
      throw err;
    }
  }

  // READ all tiers (latest version only)
  static async fetchAllPricingTiers() {
    try {
      const result = await pool.query(`
        SELECT pt.tier_id, pt.name, v.*
        FROM pricing_tiers pt
        JOIN LATERAL (
          SELECT *
          FROM pricing_tier_versions v
          WHERE v.tier_id = pt.tier_id
          ORDER BY version DESC
          LIMIT 1
        ) v ON true
        ORDER BY v.created_at DESC
      `);
      return result.rows;
    } catch (err) {
      console.error('Error in fetchAllPricingTiers:', err);
      throw err;
    }
  }

  // READ latest version of a specific tier
  static async fetchPricingTierById(tier_id) {
    try {
      const result = await pool.query(`
        SELECT pt.tier_id, pt.name, v.*
        FROM pricing_tiers pt
        JOIN LATERAL (
          SELECT *
          FROM pricing_tier_versions v
          WHERE v.tier_id = pt.tier_id
          ORDER BY version DESC
          LIMIT 1
        ) v ON true
        WHERE pt.tier_id=$1
      `, [tier_id]);
      return result.rows[0];
    } catch (err) {
      console.error('Error in fetchPricingTierById:', err);
      throw err;
    }
  }

  // UPDATE tier (creates new version row)
  static async updatePricingTier(tier_id, data) {
    try {
      const versionResult = await pool.query(
        `SELECT COALESCE(MAX(version), 0) + 1 AS next_version
         FROM pricing_tier_versions
         WHERE tier_id=$1`,
        [tier_id]
      );
      const version = versionResult.rows[0].next_version;
      const now = new Date();

      const result = await pool.query(
        `INSERT INTO pricing_tier_versions
          (tier_id, version, monthly_price, annual_price, included_users, total_customer, total_leads, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         RETURNING *`,
        [
          tier_id,
          version,
          data.monthly_price || 0,
          data.annual_price || 0,
          data.included_users || 1,
          data.total_customer || 0,
          data.total_leads || 0,
          now,
          now,
        ]
      );

      return result.rows[0];
    } catch (err) {
      console.error('Error in updatePricingTier:', err);
      throw err;
    }
  }

  // DELETE tier and all versions
  static async deletePricingTier(tier_id) {
    try {
      await pool.query('DELETE FROM pricing_tiers WHERE tier_id=$1', [tier_id]);
    } catch (err) {
      console.error('Error in deletePricingTier:', err);
      throw err;
    }
  }
}
