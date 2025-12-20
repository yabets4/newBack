import pool from '../src/loaders/db.loader.js';


async function run() {
  try {
    const { rows } = await pool.query(`SELECT COUNT(*)::int AS c FROM pricing_tiers;`);
    if (rows[0].c > 0) {
      console.log('Pricing tiers already seeded, skipping.');
      return;
    }

    const insTier = `
      INSERT INTO pricing_tiers
        (name, monthly_price, annual_price, included_users, overage_cost_per_user, storage_limit, support_level)
      VALUES
        ($1,$2,$3,$4,$5,$6,$7)
      RETURNING id;
    `;

    const pro = await pool.query(insTier, ['Pro', 100, 1000, 10, 20, 100, 'Priority']);
    const ent = await pool.query(insTier, ['Enterprise', 500, 5000, 100, 15, 1000, 'Dedicated Account Manager']);

    const insFeat = `
      INSERT INTO pricing_features (tier_id, feature_name, enabled)
      VALUES ($1,$2,$3);
    `;

    await pool.query(insFeat, [pro.rows[0].id, 'Analytics', true]);
    await pool.query(insFeat, [pro.rows[0].id, 'Priority Support', false]);

    await pool.query(insFeat, [ent.rows[0].id, 'Analytics', true]);
    await pool.query(insFeat, [ent.rows[0].id, 'Priority Support', true]);
    await pool.query(insFeat, [ent.rows[0].id, 'Custom Integrations', true]);

    console.log('Seed complete.');
  } catch (e) {
    console.error('Seed error:', e);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (process.argv[1].includes('seed.js')) {
  run();
}

export default run;
