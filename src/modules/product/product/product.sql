-- Products main table
CREATE TABLE products (
    company_id VARCHAR(20) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    product_id VARCHAR(50) NOT NULL,  -- e.g., PRD-001
    product_name VARCHAR(255) NOT NULL,
    sku VARCHAR(64) NOT NULL,
    category_id VARCHAR(50), -- references product_categories table
    status VARCHAR(50) DEFAULT 'Active',
    uom VARCHAR(50),
    product_type VARCHAR(50), -- e.g., fixed, customizable
    cost_price NUMERIC(12,2),
    price NUMERIC(12,2),
    stock INT DEFAULT 0,
    description TEXT,
    tags TEXT[],
    length NUMERIC(10,2),
    width NUMERIC(10,2),
    height NUMERIC(10,2),
    dimension_unit VARCHAR(20),
    category varchar(255),
    weight_value NUMERIC(10,2),
    weight_unit VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (company_id, product_id)
);

-- Product profile/details table (media, specs, rich text)
CREATE TABLE product_profile (
    id BIGSERIAL PRIMARY KEY,
    company_id VARCHAR(20) NOT NULL,
    product_id VARCHAR(50) NOT NULL,
    description TEXT,
    specifications TEXT,
    media JSONB, -- array of urls or objects: [{"url":"/uploads/...","alt":"..."}]
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id, product_id)
        REFERENCES products(company_id, product_id)
        ON DELETE CASCADE
);

-- Product variants table
CREATE TABLE product_variants (
    id BIGSERIAL PRIMARY KEY,
    company_id VARCHAR(20) NOT NULL,
    variant_id VARCHAR(50) NOT NULL,
    product_id VARCHAR(50) NOT NULL,
    sku VARCHAR(64),
    attributes JSONB, -- e.g., {"color":"Gray","material":"Fabric"}
    price NUMERIC(12,2),
    media TEXT,
    stock INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id, product_id)
        REFERENCES products(company_id, product_id)
        ON DELETE CASCADE
);


CREATE TABLE product_categories (
    company_id VARCHAR(20) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    category_id VARCHAR(50) NOT NULL,
    name VARCHAR(120) NOT NULL,
    parent_category_id VARCHAR(50),
    PRIMARY KEY (company_id, category_id)
);
