CREATE TABLE IF NOT EXISTS boms (
  company_id VARCHAR(20) NOT NULL,
  bom_id VARCHAR(60) NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  product_code VARCHAR(60),
  product_id VARCHAR(50),
  version VARCHAR(30),
  status VARCHAR(50) DEFAULT 'Draft',
  components JSONB DEFAULT '[]',
  estimated_cost NUMERIC DEFAULT 0,
  component_count INTEGER DEFAULT 0,
  created_by VARCHAR(100),
  approved_by VARCHAR(100),
  creation_date TIMESTAMP DEFAULT NOW(),
  last_modified_date TIMESTAMP DEFAULT NOW(),
  tags JSONB DEFAULT '[]',
  FOREIGN KEY (company_id, product_id) REFERENCES products(company_id, product_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_boms_company_id ON boms(company_id);

-- BOM components stored separately for querying and updates
CREATE TABLE IF NOT EXISTS bom_components (
  company_id VARCHAR(20) NOT NULL,
  bom_id VARCHAR(60) NOT NULL,
  component_id VARCHAR(80) NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  quantity NUMERIC DEFAULT 1,
  unit VARCHAR(40),
  manufacturer VARCHAR(200),
  part_number VARCHAR(120),
  cost NUMERIC DEFAULT 0,
  meta JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_bom_components_bom ON bom_components(company_id, bom_id);

-- Dynamic BOM rules table
CREATE TABLE IF NOT EXISTS dynamic_bom_rules (
  company_id VARCHAR(20) NOT NULL,
  rule_id VARCHAR(80) NOT NULL PRIMARY KEY,
  product_id VARCHAR(80) NOT NULL,
  name TEXT,
  description TEXT,
  priority INTEGER DEFAULT 100,
  status VARCHAR(50) DEFAULT 'Active',
  conditions JSONB DEFAULT '[]',
  actions JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dynamic_bom_rules_company_product ON dynamic_bom_rules(company_id, product_id);
