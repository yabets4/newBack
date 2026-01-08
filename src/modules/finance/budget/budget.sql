-- Budgets and budget_lines
-- company_id must match companies.company_id (VARCHAR(20))
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS next_budget_number INT NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS budgets (
  company_id VARCHAR(20) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
  budget_id VARCHAR(20) NOT NULL,
  name VARCHAR(255) NOT NULL,
  start_date DATE,
  end_date DATE,
  status VARCHAR(50) DEFAULT 'Draft',
  total_amount NUMERIC(18,2) DEFAULT 0,
  created_by VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (company_id, budget_id)
);

CREATE TABLE IF NOT EXISTS budget_lines (
  company_id VARCHAR(20) NOT NULL,
  budget_id VARCHAR(20) NOT NULL,
  budget_line_id VARCHAR(30) NOT NULL,
  account_id VARCHAR(20),
  description TEXT,
  amount NUMERIC(18,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (company_id, budget_id, budget_line_id),
  FOREIGN KEY (company_id, budget_id) REFERENCES budgets(company_id, budget_id) ON DELETE CASCADE,
  FOREIGN KEY (company_id, account_id) REFERENCES chart_of_accounts(company_id, account_id) ON DELETE SET NULL
);
