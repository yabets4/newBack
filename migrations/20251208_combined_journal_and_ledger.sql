-- Combined migration: create journal entries, lines, ledger, balances, and constraints
-- Adds next_journal_number, journal_entries, journal_lines, ledger_entries, ledger_balances, mappings and constraints

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

-- Create journal_lines table
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

-- 1. Add account_type to chart_of_accounts
ALTER TABLE IF EXISTS chart_of_accounts
  ADD COLUMN IF NOT EXISTS account_type VARCHAR(32);

-- 2. Create ledger_entries table
CREATE TABLE IF NOT EXISTS ledger_entries (
  id BIGSERIAL PRIMARY KEY,
  company_id VARCHAR(20) NOT NULL,
  journal_id VARCHAR(64) NULL,
  journal_line_number INTEGER NULL,
  posting_date DATE DEFAULT CURRENT_DATE,
  account_id VARCHAR(64) NOT NULL,
  debit NUMERIC(18,2) DEFAULT 0 NOT NULL,
  credit NUMERIC(18,2) DEFAULT 0 NOT NULL,
  amount NUMERIC(18,2) NOT NULL,
  running_balance NUMERIC(18,2) DEFAULT 0 NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ledger_company_account ON ledger_entries(company_id, account_id);

-- 3. Create ledger_balances table
CREATE TABLE IF NOT EXISTS ledger_balances (
  company_id VARCHAR(20) NOT NULL,
  account_id VARCHAR(64) NOT NULL,
  balance NUMERIC(18,2) DEFAULT 0 NOT NULL,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (company_id, account_id)
);

-- 4. Create journal_mappings table
CREATE TABLE IF NOT EXISTS journal_mappings (
  id BIGSERIAL PRIMARY KEY,
  company_id VARCHAR(20) NOT NULL,
  event_type VARCHAR(128) NOT NULL,
  debit_account_id VARCHAR(64) NOT NULL,
  credit_account_id VARCHAR(64) NOT NULL,
  amount_formula TEXT NULL,
  description_template TEXT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, event_type)
);

-- 5. Add SQL constraints to journal_lines
ALTER TABLE IF EXISTS journal_lines
  ADD CONSTRAINT chk_journal_lines_debit_credit_nonnegative CHECK ((debit >= 0) AND (credit >= 0));

ALTER TABLE IF EXISTS journal_lines
  ADD CONSTRAINT chk_journal_lines_one_side_nonzero CHECK ((debit = 0 OR credit = 0));

ALTER TABLE IF EXISTS journal_lines
  ADD CONSTRAINT chk_journal_lines_not_both_zero CHECK (NOT (debit = 0 AND credit = 0));

-- 6. Add foreign key from journal_lines.account_id to chart_of_accounts.account_id
-- Add composite foreign key (company_id, account_id) -> chart_of_accounts(company_id, account_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_journal_lines_account'
  ) THEN
    ALTER TABLE journal_lines
      ADD CONSTRAINT fk_journal_lines_account FOREIGN KEY (company_id, account_id)
      REFERENCES chart_of_accounts(company_id, account_id)
      ON DELETE RESTRICT;
  END IF;
END$$;

-- 7. Prevent deletion of posted journal_entries via trigger
CREATE OR REPLACE FUNCTION prevent_delete_posted_journal() RETURNS trigger AS $$
BEGIN
  IF OLD.status = 'Posted' THEN
    RAISE EXCEPTION 'Cannot delete posted journal entry';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_delete_posted ON journal_entries;
CREATE TRIGGER trg_prevent_delete_posted
  BEFORE DELETE ON journal_entries
  FOR EACH ROW
  EXECUTE PROCEDURE prevent_delete_posted_journal();

-- 8. Ensure journal_entries.journal_id is unique per company
ALTER TABLE IF EXISTS journal_entries
  ADD CONSTRAINT uq_company_journal_id UNIQUE (company_id, journal_id);
