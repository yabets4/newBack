import pool from '../../loaders/db.loader.js';
import { tenantQueries } from './query.js';

export default class SystemAdminModel {
  constructor() {}

  // --- USERS ---
  async findUsers({ limit = 50, offset = 0 } = {}) {
    const { rows } = await pool.query(
      `SELECT * FROM users ORDER BY id DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return rows;
  }

  async findUserById(id) {
    const { rows } = await pool.query(`SELECT * FROM users WHERE id=$1`, [id]);
    return rows[0] || null;
  }

  async createUser(payload) {
    const keys = Object.keys(payload);
    const cols = keys.map(k => `"${k}"`).join(', ');
    const params = keys.map((_, i) => `$${i + 1}`).join(', ');
    const { rows } = await pool.query(
      `INSERT INTO users (${cols}) VALUES (${params}) RETURNING *`,
      Object.values(payload)
    );
    return rows[0];
  }

  async updateUser(id, payload) {
    const keys = Object.keys(payload);
    const set = keys.map((k, i) => `"${k}"=$${i + 1}`).join(', ');
    const { rows } = await pool.query(
      `UPDATE users SET ${set} WHERE id=$${keys.length + 1} RETURNING *`,
      [...Object.values(payload), id]
    );
    return rows[0] || null;
  }

  async removeUser(id) {
    await pool.query(`DELETE FROM users WHERE id=$1`, [id]);
    return true;
  }

  // --- PRICING TIERS ---
  async findPricingTiers() {
    const { rows } = await pool.query(`SELECT * FROM pricing_tiers ORDER BY id ASC`);
    return rows;
  }

  async findPricingTierById(id) {
    const { rows } = await pool.query(`SELECT * FROM pricing_tiers WHERE id=$1`, [id]);
    return rows[0] || null;
  }

  async createPricingTier(payload) {
    const mappedPayload = {
      name: payload.name,
      monthly_price: payload.monthlyPrice,
      annual_price: payload.annualPrice,
      included_users: payload.includedUsers,
      overage_cost_per_user: payload.overageCostPerUser,
      storage_limit: payload.storageLimit,
      support_level: payload.supportLevel
    };
    const keys = Object.keys(mappedPayload);
    const cols = keys.map(k => `"${k}"`).join(', ');
    const params = keys.map((_, i) => `$${i + 1}`).join(', ');
    const { rows } = await pool.query(
      `INSERT INTO pricing_tiers (${cols}) VALUES (${params}) RETURNING *`,
      Object.values(mappedPayload)
    );
    return rows[0];
  }

  async updatePricingTier(id, payload) {
    const mappedPayload = {
      name: payload.name,
      monthly_price: payload.monthlyPrice,
      annual_price: payload.annualPrice,
      included_users: payload.includedUsers,
      overage_cost_per_user: payload.overageCostPerUser,
      storage_limit: payload.storageLimit,
      support_level: payload.supportLevel
    };
    const keys = Object.keys(mappedPayload);
    const set = keys.map((k, i) => `"${k}"=$${i + 1}`).join(', ');
    const { rows } = await pool.query(
      `UPDATE pricing_tiers SET ${set} WHERE id=$${keys.length + 1} RETURNING *`,
      [...Object.values(mappedPayload), id]
    );
    return rows[0] || null;
  }

  async removePricingTier(id) {
    await pool.query(`DELETE FROM pricing_tiers WHERE id=$1`, [id]);
    return true;
  }

  // --- PRICING FEATURES ---
  async findPricingFeatures(tierId) {
    const { rows } = await pool.query(
      `SELECT * FROM pricing_features WHERE tier_id=$1 ORDER BY id ASC`,
      [tierId]
    );
    return rows;
  }

  async createPricingFeature(payload) {
    const mappedPayload = {
      tier_id: payload.tierId ?? payload.tier_id,
      name: payload.name,
      enabled: payload.enabled
    };
    const keys = Object.keys(mappedPayload);
    const cols = keys.map(k => `"${k}"`).join(', ');
    const params = keys.map((_, i) => `$${i + 1}`).join(', ');
    const { rows } = await pool.query(
      `INSERT INTO pricing_features (${cols}) VALUES (${params}) RETURNING *`,
      Object.values(mappedPayload)
    );
    return rows[0];
  }

  async updatePricingFeature(id, payload) {
    const mappedPayload = {
      tier_id: payload.tierId ?? payload.tier_id,
      name: payload.name,
      enabled: payload.enabled
    };
    const keys = Object.keys(mappedPayload);
    const set = keys.map((k, i) => `"${k}"=$${i + 1}`).join(', ');
    const { rows } = await pool.query(
      `UPDATE pricing_features SET ${set} WHERE id=$${keys.length + 1} RETURNING *`,
      [...Object.values(mappedPayload), id]
    );
    return rows[0] || null;
  }

  async removePricingFeature(id) {
    await pool.query(`DELETE FROM pricing_features WHERE id=$1`, [id]);
    return true;
  }

  // --- COMPANY PROFILES ---
  async createCompanyProfile(payload) {
    const keys = Object.keys(payload);
    const cols = keys.map(k => `"${k}"`).join(', ');
    const params = keys.map((_, i) => `$${i + 1}`).join(', ');
    const { rows } = await pool.query(
      `INSERT INTO company_profiles (${cols}) VALUES (${params}) RETURNING *`,
      Object.values(payload)
    );
    return rows[0];
  }

  async getCompanyProfile(id) {
    const { rows } = await pool.query(`SELECT * FROM company_profiles WHERE id=$1`, [id]);
    return rows[0] || null;
  }

  async updateCompanyProfile(id, payload) {
    const keys = Object.keys(payload);
    const set = keys.map((k, i) => `"${k}"=$${i + 1}`).join(', ');
    const { rows } = await pool.query(
      `UPDATE company_profiles SET ${set} WHERE id=$${keys.length + 1} RETURNING *`,
      [...Object.values(payload), id]
    );
    return rows[0] || null;
  }

  async removeCompanyProfile(id) {
    await pool.query(`DELETE FROM company_profiles WHERE id=$1`, [id]);
    return true;
  }

  // --- COMPANY LOCATIONS ---
// model.js
async createLocations(tableName, locations) {
  if (!Array.isArray(locations) || locations.length === 0) return [];

  const created = [];

  for (const loc of locations) {
    const keys = Object.keys(loc);
    const cols = keys.map(k => `"${k}"`).join(', ');
    const params = keys.map((_, i) => `$${i + 1}`).join(', ');

    const { rows } = await pool.query(
      `INSERT INTO ${tableName} (${cols}) VALUES (${params}) RETURNING *`,
      Object.values(loc)
    );

    created.push(rows[0]);
  }

  return created;
}



  async getLocations(companyId) {
    const { rows } = await pool.query(
      `SELECT * FROM company_locations WHERE company_id=$1 ORDER BY id ASC`,
      [companyId]
    );
    return rows;
  }

  // --- PAYMENTS ---
  async createPayment(payload) {
    const keys = Object.keys(payload);
    const cols = keys.map(k => `"${k}"`).join(', ');
    const params = keys.map((_, i) => `$${i + 1}`).join(', ');
    const { rows } = await pool.query(
      `INSERT INTO company_payments (${cols}) VALUES (${params}) RETURNING *`,
      Object.values(payload)
    );
    return rows[0];
  }

  // --- TENANT USERS ---
  async createTenantUsers(tableName, users) {
    if (!Array.isArray(users) || users.length === 0) return [];
    const created = [];
    for (const user of users) {
      const keys = Object.keys(user);
      const cols = keys.map(k => `"${k}"`).join(', ');
      const params = keys.map((_, i) => `$${i + 1}`).join(', ');
      const { rows } = await pool.query(
        `INSERT INTO ${tableName} (${cols}) VALUES (${params}) RETURNING *`,
        Object.values(user)
      );
      created.push(rows[0]);
    }
    return created;
  }

   async createTenantUsersTable(prefix) {
    const queries = tenantQueries(prefix);

    for (const query of queries) {
      await pool.query(query);
    }

    console.log(`✅ Tenant tables created for prefix: ${prefix}`);
  }

}
