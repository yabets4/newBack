-- SMS Queue Table for Custom App Listener
CREATE TABLE IF NOT EXISTS sms_queue (
    id BIGSERIAL PRIMARY KEY,
    company_id VARCHAR(20) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    message_id VARCHAR(50) UNIQUE NOT NULL,
    recipients JSONB NOT NULL, -- Array of phone numbers
    message_body TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent_to_app', 'delivered', 'failed'
    created_by VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW(),
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_sms_queue_company ON sms_queue(company_id);
CREATE INDEX IF NOT EXISTS idx_sms_queue_status ON sms_queue(status);
CREATE INDEX IF NOT EXISTS idx_sms_queue_created ON sms_queue(created_at DESC);

COMMENT ON TABLE sms_queue IS 'Queue for SMS messages to be sent via custom app listener';
COMMENT ON COLUMN sms_queue.recipients IS 'JSONB array of phone numbers to send SMS to';
COMMENT ON COLUMN sms_queue.status IS 'pending: queued, sent_to_app: forwarded to app, delivered: confirmed sent, failed: error occurred';
