CREATE TABLE IF NOT EXISTS suppliers (
    company_id VARCHAR(20) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    supplier_id VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(20),
    address TEXT,
    status VARCHAR(50),
    payment_terms VARCHAR(100),
    contact_info TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    notes TEXT,
    PRIMARY KEY (company_id, supplier_id)
);