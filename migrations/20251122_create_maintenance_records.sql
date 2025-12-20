-- START/migrations/20251122_create_maintenance_records.sql
-- Create generic maintenance records table to support fixed asset and tool/machinery maintenance

CREATE TABLE IF NOT EXISTS maintenance_records (
  id bigserial PRIMARY KEY,
  company_id bigint NOT NULL,
  maintenance_type varchar(100) NOT NULL,
  related_type varchar(50) NOT NULL, -- e.g. 'fixed_asset', 'tool', 'machine'
  related_id varchar(200) NOT NULL,
  maintenance_date date,
  description text,
  cost numeric(12,2) DEFAULT 0,
  performed_by varchar(200),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_maintenance_company ON maintenance_records(company_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_related ON maintenance_records(related_type, related_id);
