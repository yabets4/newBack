
CREATE TABLE IF NOT EXISTS finished_products (
    company_id VARCHAR(20) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    finished_product_id VARCHAR(50) NOT NULL,
    product_id VARCHAR(50), 
    product_name VARCHAR(255),
    sku VARCHAR(64),
    quantity INT DEFAULT 0,
    location VARCHAR(255),
    lot_number VARCHAR(128),
    serial_number VARCHAR(128),
    cost_price NUMERIC(12,2),
    selling_price NUMERIC(12,2),
    materials_used JSONB,
    status VARCHAR(50) DEFAULT 'Available',
    uom VARCHAR(50),
    tags JSONB,
    image_url TEXT,
    image_urls JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (company_id, finished_product_id),
    FOREIGN KEY (company_id, product_id)
        REFERENCES products(company_id, product_id)
        ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_finished_products_company_fp ON finished_products(company_id, finished_product_id);
