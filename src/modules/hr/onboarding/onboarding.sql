
CREATE TABLE IF NOT EXISTS onboarding_templates (
  id SERIAL PRIMARY KEY,
  company_id VARCHAR(20) NOT NULL,
  template_id VARCHAR(50) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  tasks JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_onboarding_templates_company_template ON onboarding_templates(company_id, template_id);

CREATE TABLE IF NOT EXISTS onboarding_processes (
  id SERIAL PRIMARY KEY,
  company_id VARCHAR(20) NOT NULL,
  process_id VARCHAR(50) NOT NULL,
  employee_id VARCHAR(20),
  template_id VARCHAR(50),
  employee_name TEXT,
  employee_department TEXT,
  template_name TEXT,
  start_date DATE,
  status TEXT DEFAULT 'in_progress',
  tasks JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
  FOREIGN KEY (company_id, employee_id) REFERENCES employees(company_id, employee_id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_onboarding_processes_company_process ON onboarding_processes(company_id, process_id);
