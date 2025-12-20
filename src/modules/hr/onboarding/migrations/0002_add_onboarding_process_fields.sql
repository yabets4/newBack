-- Migration: add employee_name, employee_department, template_name to onboarding_processes
ALTER TABLE IF EXISTS onboarding_processes
  ADD COLUMN IF NOT EXISTS employee_name TEXT,
  ADD COLUMN IF NOT EXISTS employee_department TEXT,
  ADD COLUMN IF NOT EXISTS template_name TEXT;

-- Optionally create indexes for quicker lookups
CREATE INDEX IF NOT EXISTS idx_onboarding_processes_employee_name ON onboarding_processes(employee_name);
CREATE INDEX IF NOT EXISTS idx_onboarding_processes_template_name ON onboarding_processes(template_name);


DO $$
BEGIN
  IF (SELECT to_regclass('employees')) IS NOT NULL THEN
    UPDATE onboarding_processes p
    SET employee_name = e.name,
        employee_department = (SELECT department FROM employee_employment_details d WHERE d.company_id = p.company_id AND d.employee_id = p.employee_id ORDER BY d.created_at DESC LIMIT 1)
    FROM employees e
    WHERE e.company_id = p.company_id AND e.employee_id = p.employee_id;
  END IF;

  IF (SELECT to_regclass('onboarding_templates')) IS NOT NULL THEN
    UPDATE onboarding_processes p
    SET template_name = t.name
    FROM onboarding_templates t
    WHERE t.company_id = p.company_id AND (t.template_id = p.template_id OR t.id::text = p.template_id);
  END IF;
END$$;
