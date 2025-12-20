-- Add next_journal_number to companies if not exists
DO $$
BEGIN
  BEGIN
    ALTER TABLE companies ADD COLUMN next_journal_number INT NOT NULL DEFAULT 1;
  EXCEPTION WHEN duplicate_column THEN
    -- column already exists, do nothing
  END;
END$$;

-- Create journal_entries table
CREATE TABLE IF NOT EXISTS journal_entries (
  company_id VARCHAR(20) NOT NULL,
  journal_id TEXT NOT NULL,
  journal_number TEXT,
  journal_date DATE,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'Draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (company_id, journal_id),
  FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS journal_lines (
  company_id VARCHAR(20) NOT NULL,
  journal_id TEXT NOT NULL,
  line_number INTEGER NOT NULL,
  account_id TEXT,
  description TEXT,
  debit NUMERIC DEFAULT 0,
  credit NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (company_id, journal_id, line_number),
  FOREIGN KEY (company_id, journal_id) REFERENCES journal_entries(company_id, journal_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_journal_entries_company_status ON journal_entries(company_id, status);
CREATE INDEX IF NOT EXISTS idx_journal_lines_company_journal ON journal_lines(company_id, journal_id);
