-- Migration: create chart_of_accounts table and add next_account_number to companies
-- Created: 2025-12-08

-- Add a next_account_number counter on companies (used to generate account ids)
ALTER TABLE companies
ADD COLUMN next_account_number INT NOT NULL DEFAULT 1;

-- Chart of Accounts
CREATE TABLE IF NOT EXISTS chart_of_accounts (
    company_id VARCHAR(20) NOT NULL,
    account_id VARCHAR(20) NOT NULL, -- e.g. ACC-0001
    account_number VARCHAR(100),     -- human-readable number/code
    account_name VARCHAR(255) NOT NULL,
    account_type VARCHAR(50),        -- Asset, Liability, Equity, Revenue, Expense
    description TEXT,
    parent_id VARCHAR(20),           -- parent account_id within same company
    balance NUMERIC DEFAULT 0,       -- current balance (could be updated by posting jobs)
    is_cash_flow_relevant BOOLEAN DEFAULT FALSE,
    is_control_account BOOLEAN DEFAULT FALSE,
    is_system BOOLEAN DEFAULT FALSE, -- protected system account that cannot be deleted
    status VARCHAR(50) DEFAULT 'Active',
    report_group VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (company_id, account_id),
    UNIQUE (company_id, account_number),
    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    FOREIGN KEY (company_id, parent_id) REFERENCES chart_of_accounts(company_id, account_id) ON DELETE RESTRICT
);

-- Helpful index for lookups by number/name
CREATE INDEX IF NOT EXISTS idx_coa_company_account_number ON chart_of_accounts(company_id, account_number);
CREATE INDEX IF NOT EXISTS idx_coa_company_account_name ON chart_of_accounts(company_id, account_name);
