

CREATE TABLE IF NOT EXISTS designs (
  id BIGSERIAL PRIMARY KEY,
  company_id VARCHAR(20) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
  design_id VARCHAR(50) NOT NULL,
  design_name VARCHAR(255) NOT NULL,
  product_id VARCHAR(50),
  description TEXT,
  status VARCHAR(50) DEFAULT 'Pending',
  tags TEXT[],
  image_url TEXT,
  image_urls TEXT[],
  metadata JSONB,
  reviewer_notes JSONB DEFAULT '[]',
  created_by VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (company_id, design_id),
  FOREIGN KEY (company_id, product_id) REFERENCES products(company_id, product_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_designs_company ON designs(company_id);
