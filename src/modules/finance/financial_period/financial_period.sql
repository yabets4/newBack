-- Financial Periods Table
CREATE TABLE IF NOT EXISTS financial_periods (
    id BIGSERIAL PRIMARY KEY,
    company_id VARCHAR(20) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    period_id VARCHAR(20) NOT NULL, -- e.g. FP202304
    period_name VARCHAR(50) NOT NULL, -- e.g. April 2023
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('Open', 'Closed', 'Future')),
    closing_date DATE,
    closed_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (company_id, period_id)
);

CREATE INDEX IF NOT EXISTS idx_financial_periods_company ON financial_periods(company_id);
CREATE INDEX IF NOT EXISTS idx_financial_periods_dates ON financial_periods(company_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_financial_periods_status ON financial_periods(company_id, status);

-- Fiscal Settings Table
CREATE TABLE IF NOT EXISTS fiscal_settings (
    company_id VARCHAR(20) PRIMARY KEY REFERENCES companies(company_id) ON DELETE CASCADE,
    fiscal_year_start_month INT NOT NULL CHECK (fiscal_year_start_month BETWEEN 1 AND 12) DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
