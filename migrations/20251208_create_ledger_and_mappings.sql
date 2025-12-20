-- Migration: add ledger tables, journal mappings, and constraints for double-entry bookkeeping
-- 1) Add account_type to chart_of_accounts if missing
-- 2) Create ledger_entries and ledger_balances
-- 3) Create journal_mappings
-- 4) Add constraints to journal_lines
-- 5) Prevent deletion of posted journal entries via trigger

-- 1. Add account_type to chart_of_accounts
ALTER TABLE IF EXISTS chart_of_accounts
  ADD COLUMN IF NOT EXISTS account_type VARCHAR(32);

-- Ensure account_type has sensible values (optional default NULL)

-- 2. Create ledger_entries table (general ledger postings)
CREATE TABLE IF NOT EXISTS ledger_entries (
  id BIGSERIAL PRIMARY KEY,
  company_id UUID NOT NULL,
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

-- 3. Create ledger_balances (materialized-like table for current balances)
CREATE TABLE IF NOT EXISTS ledger_balances (
  company_id UUID NOT NULL,
  account_id VARCHAR(64) NOT NULL,
  balance NUMERIC(18,2) DEFAULT 0 NOT NULL,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (company_id, account_id)
);

-- 4. Create journal_mappings table
CREATE TABLE IF NOT EXISTS journal_mappings (
  id BIGSERIAL PRIMARY KEY,
  company_id UUID NOT NULL,
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
  ADD CONSTRAINT chk_journal_lines_one_side_nonzero CHECK ( (debit = 0 OR credit = 0) );

ALTER TABLE IF EXISTS journal_lines
  ADD CONSTRAINT chk_journal_lines_not_both_zero CHECK (NOT (debit = 0 AND credit = 0));

-- 6. Add foreign key from journal_lines.account_id to chart_of_accounts.account_id (restrict delete)
ALTER TABLE IF EXISTS journal_lines
  ADD CONSTRAINT fk_journal_lines_account FOREIGN KEY (account_id)
    REFERENCES chart_of_accounts(account_id)
    ON DELETE RESTRICT;

-- 7. Prevent deletion of posted journal_entries at DB level via trigger
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
