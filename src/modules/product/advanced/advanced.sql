-- Nesting Jobs
CREATE TABLE IF NOT EXISTS product_nesting_jobs (
  id SERIAL PRIMARY KEY,
  company_id VARCHAR(20) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
  job_id VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  material_id VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'Initiated',
  last_optimized TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id, job_id)
);

-- Parts for Nesting Jobs
CREATE TABLE IF NOT EXISTS product_nesting_job_parts (
  id SERIAL PRIMARY KEY,
  company_id VARCHAR(20) NOT NULL,
  job_id VARCHAR(50) NOT NULL,
  part_id VARCHAR(50) NOT NULL,
  quantity_to_nest INTEGER NOT NULL,
  FOREIGN KEY (company_id, job_id) REFERENCES product_nesting_jobs(company_id, job_id) ON DELETE CASCADE
);

-- Nesting Layouts
CREATE TABLE IF NOT EXISTS product_nesting_layouts (
  id SERIAL PRIMARY KEY,
  company_id VARCHAR(20) NOT NULL,
  layout_id VARCHAR(50) NOT NULL,
  job_id VARCHAR(50) NOT NULL,
  sheet_index INTEGER NOT NULL,
  yield_percentage NUMERIC(5, 2),
  waste_percentage NUMERIC(5, 2),
  status VARCHAR(20) DEFAULT 'Draft',
  visual_parts JSONB DEFAULT '[]',
  generated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id, layout_id),
  FOREIGN KEY (company_id, job_id) REFERENCES product_nesting_jobs(company_id, job_id) ON DELETE CASCADE
);

-- Offcuts
CREATE TABLE IF NOT EXISTS product_offcuts (
  id SERIAL PRIMARY KEY,
  company_id VARCHAR(20) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
  offcut_id VARCHAR(50) NOT NULL,
  material_id VARCHAR(50) NOT NULL,
  width NUMERIC(10, 2) NOT NULL,
  height NUMERIC(10, 2) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'Available',
  origin_job_id VARCHAR(50),
  reserved_for_job_id VARCHAR(50),
  consumed_by_job_id VARCHAR(50),
  area NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id, offcut_id)
);

-- Nesting Materials (Sheets)
CREATE TABLE IF NOT EXISTS product_nesting_materials (
  id SERIAL PRIMARY KEY,
  company_id VARCHAR(20) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
  material_id VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  width NUMERIC(10, 2) NOT NULL,
  height NUMERIC(10, 2) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  cost_per_sq_unit NUMERIC(10, 4) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id, material_id)
);

-- Nesting Parts (Nestable components with dimensions)
CREATE TABLE IF NOT EXISTS product_nesting_parts (
  id SERIAL PRIMARY KEY,
  company_id VARCHAR(20) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
  part_id VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  width NUMERIC(10, 2) NOT NULL,
  height NUMERIC(10, 2) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id, part_id)
);

CREATE INDEX IF NOT EXISTS idx_nesting_jobs_company ON product_nesting_jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_offcuts_company ON product_offcuts(company_id);
