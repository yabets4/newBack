CREATE TABLE IF NOT EXISTS quotes (
    company_id VARCHAR(20) NOT NULL 
        REFERENCES companies(company_id) ON DELETE CASCADE,

    lead_id VARCHAR(20) NOT NULL,   -- link to LEAD-XX

    quote_id VARCHAR(20) NOT NULL,  -- QUO-XX

    service_inquired VARCHAR(255) NOT NULL,

    discount_percent DECIMAL(5,2),
    tax_rate DECIMAL(5,2) DEFAULT 15.00,

    expiration_date DATE NOT NULL,

    internal_margin_percent DECIMAL(5,2),

    version INT DEFAULT 1,
    status VARCHAR(50) DEFAULT 'Draft',

    payment_terms VARCHAR(255) NOT NULL,
    delivery_terms VARCHAR(255) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (company_id, quote_id),

    FOREIGN KEY (company_id, lead_id)
        REFERENCES leads(company_id, lead_id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS quote_items (
    id BIGSERIAL PRIMARY KEY,
    company_id VARCHAR(20) NOT NULL,
    quote_id VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL, -- Product or service name
    quantity INT DEFAULT 1,
    unit_price DECIMAL(12,2) DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id, quote_id)
      REFERENCES quotes(company_id, quote_id)
      ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS quote_item_attachments (
    id BIGSERIAL PRIMARY KEY,
    company_id VARCHAR(20) NOT NULL,
    quote_item_id BIGINT NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(50), -- PDF, DOCX, STL, OBJ
    description TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (quote_item_id)
      REFERENCES quote_items(id)
      ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS quote_attachments (
    id BIGSERIAL PRIMARY KEY,
    company_id VARCHAR(20) NOT NULL,
    quote_id VARCHAR(20) NOT NULL,
    file_url TEXT NOT NULL,
    description TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id, quote_id)
      REFERENCES quotes(company_id, quote_id)
      ON DELETE CASCADE
);