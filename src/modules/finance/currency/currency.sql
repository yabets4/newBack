-- Currency management tables

CREATE TABLE IF NOT EXISTS currencies (
  company_id VARCHAR(20) NOT NULL,
  id TEXT NOT NULL,
  code TEXT NOT NULL,
  name TEXT,
  symbol TEXT,
  is_base_currency BOOLEAN DEFAULT FALSE,
  decimal_places INTEGER DEFAULT 2,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by TEXT,
  PRIMARY KEY (company_id, id),
  FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS currency_exchange_rates (
  id BIGSERIAL PRIMARY KEY,
  company_id VARCHAR(20) NOT NULL,
  currency_id TEXT NOT NULL,
  rate_date DATE,
  rate NUMERIC(18,6),
  to_currency TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (company_id, currency_id) REFERENCES currencies(company_id, id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_currencies_company ON currencies(company_id);
CREATE INDEX IF NOT EXISTS idx_currency_rates_company_currency ON currency_exchange_rates(company_id, currency_id);
