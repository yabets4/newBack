-- Migration: add next_attendance_number to companies and create base shift table

-- Add next_attendance_number to companies (if not exists)
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS next_attendance_number bigint DEFAULT 0;

-- Create a base 'shift' table (non-prefixed). Tenant-prefixed tables will be named <tenant>_shift.
-- You may need to run per-tenant CREATE TABLE statements using the tenant prefix.

CREATE TABLE IF NOT EXISTS shift (
  id serial PRIMARY KEY,
  shift_id varchar(64) UNIQUE,
  company_id varchar(64),
  employee_id varchar(64) NOT NULL,
  shift_date date NOT NULL,
  start_time time,
  end_time time,
  type varchar(64),
  location_name varchar(255),
  notes text,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

-- Indexes to speed up queries
CREATE INDEX IF NOT EXISTS idx_shift_employee_id ON shift(employee_id);
CREATE INDEX IF NOT EXISTS idx_shift_company_id ON shift(company_id);
CREATE INDEX IF NOT EXISTS idx_shift_date ON shift(shift_date);

-- Notes:
-- The application uses tenant-prefixed tables (e.g. mytenant_shift). To provision those, run
-- a CREATE TABLE <tenant>_shift AS TABLE shift WITH NO DATA; then add any tenant-specific constraints.
-- Alternatively, modify your migration tooling to create per-tenant tables using the tenant prefixes in your environment.
