import pool from '../src/loaders/db.loader.js';

async function migrate() {
  try {
    // --- USERS ---
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Table users created');

    // --- PRICING TIERS ---
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pricing_tiers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        monthly_price NUMERIC NOT NULL,
        annual_price NUMERIC NOT NULL,
        included_users INT NOT NULL,
        overage_cost_per_user NUMERIC NOT NULL,
        storage_limit NUMERIC NOT NULL,
        support_level VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Table pricing_tiers created');

    // --- PRICING FEATURES ---
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pricing_features (
        id SERIAL PRIMARY KEY,
        tier_id INT NOT NULL REFERENCES pricing_tiers(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        enabled BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Table pricing_features created');

    console.log('🎉 Migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

migrate();
