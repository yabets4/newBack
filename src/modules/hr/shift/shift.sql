
CREATE TABLE IF NOT EXISTS shift (
  id serial PRIMARY KEY,
  shift_id varchar(64) UNIQUE,
  company_id varchar(64),
  employee_id varchar(64) NOT NULL,
  shift_date date NOT NULL,
  start_time time,
  end_time time,
  employee_name VARCHAR(255),
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
