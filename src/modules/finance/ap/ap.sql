-- AP migration: create AP tables

DO $$
BEGIN
  BEGIN
    ALTER TABLE companies ADD COLUMN next_ap_invoice_number INT NOT NULL DEFAULT 1;
  EXCEPTION WHEN duplicate_column THEN
    -- column exists
  END;
END$$;

CREATE TABLE IF NOT EXISTS ap_invoices (
  company_id VARCHAR(20) NOT NULL,
  invoice_id TEXT NOT NULL,
  invoice_number TEXT,
  vendor_id VARCHAR(64) NULL,
  vendor_name TEXT NULL,
  invoice_date DATE,
  due_date DATE,
  description TEXT,
  total_amount NUMERIC(18,2) DEFAULT 0,
  status TEXT DEFAULT 'Draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (company_id, invoice_id),
  FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ap_invoice_lines (
  company_id VARCHAR(20) NOT NULL,
  invoice_id TEXT NOT NULL,
  line_number INTEGER NOT NULL,
  po_id TEXT NULL,
  grn_id TEXT NULL,
  item_id TEXT NULL,
  description TEXT NULL,
  quantity NUMERIC DEFAULT 0,
  unit_price NUMERIC DEFAULT 0,
  line_amount NUMERIC DEFAULT 0,
  PRIMARY KEY (company_id, invoice_id, line_number),
  FOREIGN KEY (company_id, invoice_id) REFERENCES ap_invoices(company_id, invoice_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ap_discrepancies (
  id BIGSERIAL PRIMARY KEY,
  company_id VARCHAR(20) NOT NULL,
  invoice_id TEXT NOT NULL,
  line_number INTEGER NULL,
  type VARCHAR(50) NOT NULL,
  message TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Attachments for AP invoices
CREATE TABLE IF NOT EXISTS ap_invoice_attachments (
  id BIGSERIAL PRIMARY KEY,
  company_id VARCHAR(20) NOT NULL,
  invoice_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  storage_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (company_id, invoice_id) REFERENCES ap_invoices(company_id, invoice_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ap_invoices_company ON ap_invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_ap_invoice_lines_company_invoice ON ap_invoice_lines(company_id, invoice_id);
CREATE INDEX IF NOT EXISTS idx_ap_discrepancies_company_invoice ON ap_discrepancies(company_id, invoice_id);
