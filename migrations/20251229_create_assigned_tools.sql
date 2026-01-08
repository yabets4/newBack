-- Migration: create assigned_tools table
CREATE TABLE IF NOT EXISTS assigned_tools (
  id SERIAL PRIMARY KEY,
  company_id VARCHAR(20) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
  asset_id VARCHAR(128) DEFAULT NULL,
  asset_name VARCHAR(255) DEFAULT NULL,
  asset_type VARCHAR(128) DEFAULT NULL,
  employee_id VARCHAR(20) DEFAULT NULL,
  employee_name VARCHAR(255) DEFAULT NULL,
  assignment_date DATE DEFAULT NOW(),
  return_date DATE DEFAULT NULL,
  status VARCHAR(64) DEFAULT 'assigned',
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (company_id, employee_id) REFERENCES employees(company_id, employee_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_assigned_tools_company ON assigned_tools(company_id);
CREATE INDEX IF NOT EXISTS idx_assigned_tools_employee ON assigned_tools(employee_id);
