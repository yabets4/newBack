CREATE TABLE IF NOT EXISTS performance_reviews (
  id SERIAL PRIMARY KEY,
  company_id VARCHAR(20) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
  review_id TEXT NOT NULL,
  employee_id VARCHAR(20) NOT NULL,
  reviewer_id VARCHAR(20),
  review_date DATE,
  period_start DATE,
  period_end DATE,
  score NUMERIC,
  summary TEXT,
  details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id, review_id),
  FOREIGN KEY (company_id, employee_id) REFERENCES employees(company_id, employee_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS performance_feedback (
  id SERIAL PRIMARY KEY,
  company_id VARCHAR(20) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
  feedback_id TEXT NOT NULL,
  from_employee_id VARCHAR(20),
  to_employee_id VARCHAR(20),
  date DATE,
  type TEXT,
  content TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id, feedback_id),
  FOREIGN KEY (company_id, from_employee_id) REFERENCES employees(company_id, employee_id) ON DELETE SET NULL,
  FOREIGN KEY (company_id, to_employee_id) REFERENCES employees(company_id, employee_id) ON DELETE SET NULL
);