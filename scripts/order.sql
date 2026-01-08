-- Orders table
CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    company_id VARCHAR(20) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    order_id VARCHAR(20) NOT NULL, -- ORD-XX
    quote_id VARCHAR(20) NOT NULL,
    lead_id VARCHAR(20) NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending',
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes VARCHAR(500),
    delivery_date DATE,
    delivery_address VARCHAR(500),
    total_amount DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (company_id, order_id),
    FOREIGN KEY (company_id, quote_id) REFERENCES quotes(company_id, quote_id) ON DELETE CASCADE
);

CREATE TABLE order_items (
    id BIGSERIAL PRIMARY KEY,
    company_id VARCHAR(20) NOT NULL,
    order_id VARCHAR(20) NOT NULL,
    quote_id VARCHAR(20) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INT DEFAULT 1,
    unit_price DECIMAL(12,2) DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id, order_id) REFERENCES orders(company_id, order_id) ON DELETE CASCADE,
    FOREIGN KEY (company_id, quote_id) REFERENCES quotes(company_id, quote_id) ON DELETE CASCADE
);
