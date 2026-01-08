-- SMS Settings and Templates
CREATE TABLE IF NOT EXISTS sms_settings (
    company_id VARCHAR(20) PRIMARY KEY REFERENCES companies(company_id) ON DELETE CASCADE,
    listener_api_key VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sms_templates (
    id BIGSERIAL PRIMARY KEY,
    company_id VARCHAR(20) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    variables JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sms_templates_company ON sms_templates(company_id);

-- Add sample templates
INSERT INTO sms_templates (company_id, name, content, variables)
SELECT company_id, 'Order Confirmation', 'Your order #{order_id} has been confirmed. Thank you!', '["order_id"]'::jsonb
FROM companies LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO sms_templates (company_id, name, content, variables)
SELECT company_id, 'Payment Reminder', 'Hi {name}, your payment of {amount} is due on {date}.', '["name", "amount", "date"]'::jsonb
FROM companies LIMIT 1
ON CONFLICT DO NOTHING;
