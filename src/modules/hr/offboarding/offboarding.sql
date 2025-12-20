
CREATE TABLE IF NOT EXISTS offboarding_templates (
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

CREATE UNIQUE INDEX IF NOT EXISTS idx_offboarding_templates_company_template ON offboarding_templates(company_id, template_id);

CREATE TABLE IF NOT EXISTS offboarding_processes (
  id SERIAL PRIMARY KEY,
  company_id VARCHAR(20) NOT NULL,
  process_id VARCHAR(50) NOT NULL,
  employee_id VARCHAR(20),
  template_id VARCHAR(50),
  start_date DATE,
  status TEXT DEFAULT 'in_progress',
  tasks JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
  FOREIGN KEY (company_id, employee_id) REFERENCES employees(company_id, employee_id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_offboarding_processes_company_process ON offboarding_processes(company_id, process_id);
