-- Migration: create leave_requests table (global, non-prefixed)
-- Created: 2025-11-19

CREATE TABLE IF NOT EXISTS leave_requests (
  id BIGSERIAL PRIMARY KEY,
  company_id VARCHAR(50) NOT NULL,
  employee_id VARCHAR(50) NOT NULL,
  leave_type VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  number_of_days INT GENERATED ALWAYS AS (end_date - start_date + 1) STORED,
  reason TEXT,
  approver_comments TEXT,
  status VARCHAR(50) DEFAULT 'Pending',
  created_by VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_leave_requests_company ON leave_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);

-- Notes:
-- This creates a global `leave_requests` table that stores records across companies using `company_id`.
-- If your deployment uses tenant-prefixed tables, consider creating per-tenant tables (e.g. mytenant_leave_requests)
-- by copying this schema or by running tenant provisioning scripts during tenant creation.
