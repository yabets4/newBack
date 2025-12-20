CREATE TABLE IF NOT EXISTS leads (
    company_id VARCHAR(20) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    customer_id VARCHAR(20),
    lead_id VARCHAR(20) NOT NULL,  -- LEAD-XX
    lead_type VARCHAR(20) NOT NULL CHECK (lead_type IN ('Individual', 'Company')),
    name VARCHAR(255) NOT NULL,
    primary_phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    contact_person_name VARCHAR(255),
    contact_person_number VARCHAR(255),
    contact_person_job VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (company_id, lead_id)
);

CREATE TABLE IF NOT EXISTS leads_profile (
    id BIGSERIAL PRIMARY KEY,
    company_id VARCHAR(20) NOT NULL,
    lead_id VARCHAR(20) NOT NULL,
    assigned_to VARCHAR(100) NOT NULL,
    lead_source VARCHAR(100) NOT NULL,
    referred_by VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'New',
    priority VARCHAR(20) NOT NULL DEFAULT 'Medium',
    service_requested VARCHAR(255) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id, lead_id)
      REFERENCES leads(company_id, lead_id)
      ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS leads_attachments (
    id BIGSERIAL PRIMARY KEY,
    company_id VARCHAR(20) NOT NULL,
    lead_id VARCHAR(20) NOT NULL,
    file_url TEXT NOT NULL,
    description TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id, lead_id)
      REFERENCES leads(company_id, lead_id)
      ON DELETE CASCADE
);