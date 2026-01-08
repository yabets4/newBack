CREATE TABLE IF NOT EXISTS product_costing_rules (
  id SERIAL PRIMARY KEY,
  company_id VARCHAR(20) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
  rule_id VARCHAR(50) NOT NULL,
  type VARCHAR(20) NOT NULL, -- 'labor' or 'overhead'
  category VARCHAR(255) NOT NULL,
  rate NUMERIC(12, 2) NOT NULL,
  unit VARCHAR(100) NOT NULL,
  description TEXT,
  effective_start_date DATE NOT NULL,
  effective_end_date DATE,
  status VARCHAR(20) DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id, rule_id)
);

CREATE INDEX IF NOT EXISTS idx_product_costing_rules_company ON product_costing_rules(company_id);
