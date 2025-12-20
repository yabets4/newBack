-- Add employee_name column to shift table so we can store employee display name
ALTER TABLE IF EXISTS shift
ADD COLUMN IF NOT EXISTS employee_name VARCHAR(255);

-- Optionally you can backfill employee_name from employees table if available:
-- UPDATE shift s
-- SET employee_name = e.name
-- FROM employees e
-- WHERE s.company_id = e.company_id AND s.employee_id = e.employee_id;
