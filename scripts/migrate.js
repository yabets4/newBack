import pool from '../src/loaders/db.loader.js';

const baseDDL = {
  products: `CREATE TABLE IF NOT EXISTS %TABLE% (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    sku VARCHAR(64) NOT NULL,
    price NUMERIC(12,2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  );`,
  customers: `CREATE TABLE IF NOT EXISTS %TABLE% (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(120),
    phone VARCHAR(32),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  );`,
  users: `CREATE TABLE IF NOT EXISTS %TABLE% (
    id SERIAL PRIMARY KEY,
    email VARCHAR(120) UNIQUE NOT NULL,
    name VARCHAR(120) NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'user',
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  );`,
projects: `CREATE TABLE IF NOT EXISTS %TABLE% (
  id SERIAL PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  description TEXT,
  owner_id INT NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'planned',
  start_date DATE,
  due_date DATE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);`,
inventory_items: `CREATE TABLE IF NOT EXISTS %TABLE% (
  id SERIAL PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  sku VARCHAR(64) NOT NULL,
  qty_on_hand INT NOT NULL DEFAULT 0,
  reorder_level INT NOT NULL DEFAULT 0,
  location VARCHAR(120),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);`,
employees: `CREATE TABLE IF NOT EXISTS %TABLE% (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(80) NOT NULL,
  last_name VARCHAR(80) NOT NULL,
  email VARCHAR(120) UNIQUE NOT NULL,
  phone VARCHAR(32),
  position VARCHAR(120) NOT NULL,
  hire_date DATE NOT NULL,
  salary NUMERIC(14,2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);`,
transactions: `CREATE TABLE IF NOT EXISTS %TABLE% (
  id SERIAL PRIMARY KEY,
  type VARCHAR(16) NOT NULL,
  amount NUMERIC(14,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  account_id INT NOT NULL,
  reference VARCHAR(160),
  occurred_at TIMESTAMP NOT NULL,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);`,
purchase_orders: `CREATE TABLE IF NOT EXISTS %TABLE% (
  id SERIAL PRIMARY KEY,
  supplier_name VARCHAR(160) NOT NULL,
  po_number VARCHAR(64) UNIQUE NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'draft',
  total_amount NUMERIC(14,2) NOT NULL,
  ordered_at TIMESTAMP NOT NULL,
  expected_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);`,
reports: `CREATE TABLE IF NOT EXISTS %TABLE% (
  id SERIAL PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  type VARCHAR(32) NOT NULL,
  params JSONB NOT NULL DEFAULT '{}'::jsonb,
  generated_at TIMESTAMP,
  status VARCHAR(16) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);`,
notifications: `CREATE TABLE IF NOT EXISTS %TABLE% (
  id SERIAL PRIMARY KEY,
  channel VARCHAR(16) NOT NULL,
  recipient VARCHAR(160) NOT NULL,
  subject VARCHAR(160),
  body TEXT NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'pending',
  scheduled_at TIMESTAMP,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);`,
};

async function ensureTables(prefix) {
  for (const [base, ddl] of Object.entries(baseDDL)) {
    const full = `${prefix}_${base}`;
    const sql = ddl.replace('%TABLE%', full);
    await pool.query(sql);
  }
}

const tenant = process.argv[2];
if (!tenant) {
  console.error('Usage: node scripts/migrate.js <tenantPrefix>');
  process.exit(1);
}
ensureTables(tenant.toLowerCase())
  .then(()=>{ console.log('Migrated for', tenant); process.exit(0); })
  .catch((e)=>{ console.error(e); process.exit(1); });
