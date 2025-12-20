-- Migration: create employee_leave_balances table
-- Created: 2025-11-19

CREATE TABLE IF NOT EXISTS employee_leave_balances (
  id BIGSERIAL PRIMARY KEY,
  company_id VARCHAR(50) NOT NULL,
  employee_id VARCHAR(50) NOT NULL,
  leave_type VARCHAR(100) NOT NULL,
  leave_type_key VARCHAR(100), -- machine-friendly key like 'annual', 'sick'
  total_days INT DEFAULT 0,
  remaining_days INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_employee_leave_balances_employee_type
  ON employee_leave_balances(company_id, employee_id, leave_type_key);

CREATE INDEX IF NOT EXISTS idx_employee_leave_balances_employee ON employee_leave_balances(company_id, employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_leave_balances_type ON employee_leave_balances(leave_type_key);
