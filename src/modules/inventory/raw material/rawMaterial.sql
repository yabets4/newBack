-- Main raw materials table
CREATE TABLE raw_materials (
    company_id VARCHAR(20) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    raw_material_id VARCHAR(20) NOT NULL,  -- e.g., RM-FAB-001
    name VARCHAR(255) NOT NULL,
    category_id VARCHAR(20) NOT NULL,      -- references categories table
    uom VARCHAR(20) NOT NULL,           -- references units_of_measure table
    cost_price DECIMAL(10,2) NOT NULL,
    minimum_stock INT NOT NULL,
    shelf_life DATE,
    supplier_id VARCHAR(20) NOT NULL,      -- references suppliers table
    current_stock INT DEFAULT 0,
    location VARCHAR(20) NOT NULL REFERENCES locations(name),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id, location) REFERENCES locations(company_id, name),
    PRIMARY KEY (company_id, raw_material_id)
);

-- Raw material profile/details table
CREATE TABLE raw_materials_profile (
    id BIGSERIAL PRIMARY KEY,
    company_id VARCHAR(20) NOT NULL,
    raw_material_id VARCHAR(20) NOT NULL,
    description TEXT,
    specifications TEXT,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id, raw_material_id)
        REFERENCES raw_materials(company_id, raw_material_id)
        ON DELETE CASCADE
);

-- Categories lookup table
CREATE TABLE categories (
    company_id VARCHAR(20) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    category_id VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    PRIMARY KEY (company_id, category_id)
);

-- Units of measure lookup table
CREATE TABLE units_of_measure (
    company_id VARCHAR(20) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    uom_id VARCHAR(20) NOT NULL,
    name VARCHAR(50) NOT NULL,
    PRIMARY KEY (company_id, uom_id)
);

-- Suppliers table
CREATE TABLE suppliers (
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
    notes TEXT,
    PRIMARY KEY (company_id, supplier_id)
);

CREATE TABLE locations (
    id BIGSERIAL PRIMARY KEY,
    company_id VARCHAR(20) NOT NULL REFERENCES companies(company_id),
    name VARCHAR(255),
    address TEXT,
    contact VARCHAR(100),
    operational_hours VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (company_id, name)
);