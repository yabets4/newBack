-- Telegram Notification Module Schema

-- 1. Telegram Settings per Company
CREATE TABLE IF NOT EXISTS telegram_settings (
    company_id VARCHAR(20) PRIMARY KEY REFERENCES companies(company_id) ON DELETE CASCADE,
    bot_token TEXT NOT NULL,
    bot_username VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    owner_chat_id VARCHAR(50), -- Default chat ID for critical alerts
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Telegram Subscribers Mapping
CREATE TABLE IF NOT EXISTS telegram_subscribers (
    id BIGSERIAL PRIMARY KEY,
    company_id VARCHAR(20) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    subscriber_type VARCHAR(50) NOT NULL, -- 'Employee', 'Customer', 'Lead', 'Owner'
    external_id VARCHAR(50), -- EMP-01, CUS-01, etc.
    chat_id VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(company_id, subscriber_type, external_id),
    UNIQUE(company_id, chat_id)
);

-- 3. Automation Rules for Alerts
CREATE TABLE IF NOT EXISTS telegram_automation_rules (
    id BIGSERIAL PRIMARY KEY,
    company_id VARCHAR(20) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    rule_type VARCHAR(50) NOT NULL, -- 'low_stock', 'critical_finance', 'order_status'
    threshold DECIMAL(15,2), -- e.g., 5 for minimum stock, or 0 for finance
    target_subscriber_type VARCHAR(50) DEFAULT 'Owner', -- default recipient
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_telegram_subscribers_lookup ON telegram_subscribers(company_id, subscriber_type, external_id);
CREATE INDEX IF NOT EXISTS idx_telegram_automation_rules_company ON telegram_automation_rules(company_id);
