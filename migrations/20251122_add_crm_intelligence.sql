-- Migration: 20251122_add_crm_intelligence.sql
-- Adds CRM/ERP intelligence fields, triggers, and helper functions
-- NOTE: Review and run in a safe environment before applying to production.

BEGIN;

-- 1) Add common timeline columns to main entities (leads, customers, quotes, orders, quote_items)
ALTER TABLE IF EXISTS leads
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS stage_entered_at TIMESTAMP;

ALTER TABLE IF EXISTS customers
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS stage_entered_at TIMESTAMP;

ALTER TABLE IF EXISTS quotes
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS stage_entered_at TIMESTAMP;

ALTER TABLE IF EXISTS orders
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS stage_entered_at TIMESTAMP;

ALTER TABLE IF EXISTS quote_items
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS stage_entered_at TIMESTAMP;

-- 2) Lead Intelligence: new fields
ALTER TABLE IF EXISTS leads
  ADD COLUMN IF NOT EXISTS lead_source VARCHAR(100),
  ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS next_follow_up_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS lead_score INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS activity_logs JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS conversion_probability NUMERIC(5,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS interactions JSONB DEFAULT '[]'::jsonb;

-- 3) Customer Intelligence: new fields
ALTER TABLE IF EXISTS customer_profiles
  ADD COLUMN IF NOT EXISTS lifetime_value NUMERIC(14,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS repeat_order_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS preferred_discount_range VARCHAR(100),
  ADD COLUMN IF NOT EXISTS last_purchase_date TIMESTAMP,
  ADD COLUMN IF NOT EXISTS customer_notes JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS interactions JSONB DEFAULT '[]'::jsonb;

-- 4) Quote & Order Optimization fields
ALTER TABLE IF EXISTS quote_items
  ADD COLUMN IF NOT EXISTS cost_price NUMERIC(14,4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS margin_amount NUMERIC(14,4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS margin_percent NUMERIC(6,2) DEFAULT 0;

ALTER TABLE IF EXISTS quotes
  ADD COLUMN IF NOT EXISTS status_history JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS interactions JSONB DEFAULT '[]'::jsonb;

ALTER TABLE IF EXISTS orders
  ADD COLUMN IF NOT EXISTS status_history JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS interactions JSONB DEFAULT '[]'::jsonb;

-- 5) Interaction/logging helper table (optional): keep normalized interactions if desired
CREATE TABLE IF NOT EXISTS crm_interactions (
  id BIGSERIAL PRIMARY KEY,
  company_id VARCHAR(20) NOT NULL,
  entity_type VARCHAR(50) NOT NULL, -- 'lead','customer','quote','order'
  entity_id VARCHAR(50) NOT NULL,
  interaction_type VARCHAR(50), -- 'email','call','meeting','doc_view'
  payload JSONB,
  actor_user_id VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_interactions_entity ON crm_interactions(entity_type, entity_id);

-- 6) Trigger to keep updated_at in sync
CREATE OR REPLACE FUNCTION crm_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach to common tables
DO $$
BEGIN
  IF EXISTS(SELECT 1 FROM pg_class WHERE relname='leads') THEN
    CREATE TRIGGER trg_leads_set_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION crm_set_updated_at();
  END IF;
  IF EXISTS(SELECT 1 FROM pg_class WHERE relname='customer_profiles') THEN
    CREATE TRIGGER trg_customers_set_updated_at BEFORE UPDATE ON customer_profiles FOR EACH ROW EXECUTE FUNCTION crm_set_updated_at();
  END IF;
  IF EXISTS(SELECT 1 FROM pg_class WHERE relname='quotes') THEN
    CREATE TRIGGER trg_quotes_set_updated_at BEFORE UPDATE ON quotes FOR EACH ROW EXECUTE FUNCTION crm_set_updated_at();
  END IF;
  IF EXISTS(SELECT 1 FROM pg_class WHERE relname='orders') THEN
    CREATE TRIGGER trg_orders_set_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION crm_set_updated_at();
  END IF;
  IF EXISTS(SELECT 1 FROM pg_class WHERE relname='quote_items') THEN
    CREATE TRIGGER trg_quote_items_set_updated_at BEFORE UPDATE ON quote_items FOR EACH ROW EXECUTE FUNCTION crm_set_updated_at();
  END IF;
END$$;

-- 7) Function to update customer LTV and repeat_order_count on order insert
CREATE OR REPLACE FUNCTION crm_update_customer_ltv()
RETURNS TRIGGER AS $$
DECLARE
  ord_total NUMERIC := COALESCE(NEW.total_amount, 0);
  cus_id VARCHAR(20) := NEW.customer_id;
  company VARCHAR(20) := NEW.company_id;
  prev_ltv NUMERIC;
  prev_count INT;
BEGIN
  IF cus_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT lifetime_value, repeat_order_count INTO prev_ltv, prev_count
  FROM customer_profiles
  WHERE company_id = company AND customer_id = cus_id
  LIMIT 1;

  IF FOUND THEN
    UPDATE customer_profiles
    SET lifetime_value = COALESCE(prev_ltv,0) + ord_total,
        repeat_order_count = COALESCE(prev_count,0) + 1,
        last_purchase_date = NOW(),
        updated_at = NOW()
    WHERE company_id = company AND customer_id = cus_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to orders table inserts
DO $$
BEGIN
  IF EXISTS(SELECT 1 FROM pg_class WHERE relname='orders') THEN
    IF NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgname='trg_orders_update_customer_ltv') THEN
      CREATE TRIGGER trg_orders_update_customer_ltv
      AFTER INSERT ON orders
      FOR EACH ROW EXECUTE FUNCTION crm_update_customer_ltv();
    END IF;
  END IF;
END$$;

-- 8) Function to compute lead score and conversion probability (basic algorithm)
CREATE OR REPLACE FUNCTION crm_compute_lead_score(p_company VARCHAR, p_lead_id VARCHAR)
RETURNS VOID AS $$
DECLARE
  l RECORD;
  interactions_count INT := 0;
  recent_points INT := 0;
  quote_count INT := 0;
  order_count INT := 0;
  base_score INT := 0;
  computed_score INT := 0;
  conv_prob NUMERIC := 0;
BEGIN
  SELECT * INTO l FROM leads WHERE company_id = p_company AND lead_id = p_lead_id LIMIT 1;
  IF NOT FOUND THEN RETURN; END IF;

  -- interactions: count items in interactions jsonb array if present
  IF l.interactions IS NOT NULL THEN
    SELECT jsonb_array_length(l.interactions) INTO interactions_count;
  END IF;

  -- recency: last_contacted_at within 7 days -> +30, within 30 -> +10
  IF l.last_contacted_at IS NOT NULL THEN
    IF l.last_contacted_at > NOW() - INTERVAL '7 days' THEN
      recent_points := recent_points + 30;
    ELSIF l.last_contacted_at > NOW() - INTERVAL '30 days' THEN
      recent_points := recent_points + 10;
    END IF;
  END IF;

  -- quotes and orders associated with lead
  SELECT COUNT(*) INTO quote_count FROM quotes WHERE company_id = p_company AND lead_id = p_lead_id;
  SELECT COUNT(*) INTO order_count FROM orders WHERE company_id = p_company AND lead_id = p_lead_id;

  base_score := interactions_count * 5 + quote_count * 20 + order_count * 50 + recent_points;
  IF base_score > 100 THEN computed_score := 100; ELSE computed_score := base_score; END IF;

  -- conversion probability: heuristic mapping
  conv_prob := LEAST(100.0, computed_score * 0.9 + quote_count * 2 + order_count * 5);

  UPDATE leads
  SET lead_score = computed_score,
      conversion_probability = ROUND(conv_prob::numeric,2),
      updated_at = NOW()
  WHERE company_id = p_company AND lead_id = p_lead_id;
END;
$$ LANGUAGE plpgsql;

-- 9) Function to compute profit margin on quote_items
CREATE OR REPLACE FUNCTION crm_compute_quote_item_margin()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.cost_price IS NULL THEN
    NEW.cost_price := 0;
  END IF;
  NEW.margin_amount := (COALESCE(NEW.unit_price,0) - NEW.cost_price) * COALESCE(NEW.quantity,1);
  IF COALESCE(NEW.unit_price,0) = 0 THEN
    NEW.margin_percent := 0;
  ELSE
    NEW.margin_percent := CASE WHEN NEW.cost_price = 0 THEN 100 ELSE ((NEW.unit_price - NEW.cost_price)/NEW.unit_price * 100) END;
  END IF;
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF EXISTS(SELECT 1 FROM pg_class WHERE relname='quote_items') THEN
    IF NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgname='trg_quote_items_compute_margin') THEN
      CREATE TRIGGER trg_quote_items_compute_margin
      BEFORE INSERT OR UPDATE ON quote_items
      FOR EACH ROW EXECUTE FUNCTION crm_compute_quote_item_margin();
    END IF;
  END IF;
END$$;

-- 10) Analytics helper: pipeline fetch function (returns JSON with nested chain)
CREATE OR REPLACE FUNCTION crm_fetch_full_pipeline(p_company VARCHAR)
RETURNS JSONB LANGUAGE sql AS $$
  SELECT jsonb_agg(row_to_json(t)) FROM (
    SELECT l.*, (
      SELECT jsonb_agg(qrow) FROM (
        SELECT q.*, (
          SELECT jsonb_agg(orow) FROM (
            SELECT o.* FROM orders o WHERE o.company_id = q.company_id AND o.quote_id = q.quote_id
          ) orow
        ) as orders
        FROM quotes q WHERE q.company_id = l.company_id AND q.lead_id = l.lead_id
      ) qrow
    ) as quotes
    FROM leads l WHERE l.company_id = p_company
  ) t;
$$;

COMMIT;

-- End of migration
