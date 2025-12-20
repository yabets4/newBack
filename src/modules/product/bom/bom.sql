-- BOMs table for product module
CREATE TABLE IF NOT EXISTS boms (
  company_id VARCHAR(20) NOT NULL,
  bom_id VARCHAR(60) NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  product_code VARCHAR(60),
  version VARCHAR(30),
  status VARCHAR(50) DEFAULT 'Draft',
  components JSONB DEFAULT '[]',
  estimated_cost NUMERIC DEFAULT 0,
  component_count INTEGER DEFAULT 0,
  created_by VARCHAR(100),
  approved_by VARCHAR(100),
  creation_date TIMESTAMP DEFAULT NOW(),
  last_modified_date TIMESTAMP DEFAULT NOW(),
  tags JSONB DEFAULT '[]'
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
