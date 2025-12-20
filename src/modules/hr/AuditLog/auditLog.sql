CREATE TABLE audit_logs (
    audit_id BIGSERIAL PRIMARY KEY,
    company_id VARCHAR(20) NOT NULL,
    user_id VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    endpoint TEXT NOT NULL,           
    record_id TEXT, 
    ip_address TEXT,                    
    user_agent TEXT,
    action TEXT NOT NULL,
    before_data JSONB,              
    after_data JSONB,
    details TEXT,
    FOREIGN KEY (company_id, user_id)
        REFERENCES users(company_id, user_id)
        ON DELETE CASCADE
);

CREATE INDEX idx_audit_company ON audit_logs(company_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_record ON audit_logs(record_id);
CREATE INDEX idx_audit_when ON audit_logs(created_at);
