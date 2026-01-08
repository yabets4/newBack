CREATE TABLE IF NOT EXISTS customers (
    id BIGSERIAL PRIMARY KEY,
    company_id VARCHAR(20) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    customer_id VARCHAR(20) NOT NULL,  
    password_hash VARCHAR(255) NOT NULL DEFAULT 0000,
    status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active','Inactive')),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (company_id, customer_id)  
);

CREATE TABLE IF NOT EXISTS customer_profiles (
    id BIGSERIAL PRIMARY KEY,
    company_id VARCHAR(20) NOT NULL,
    customer_id VARCHAR(20) NOT NULL, -- CUS-XX
    customer_type VARCHAR(20) NOT NULL CHECK (customer_type IN ('Individual','Company')),
    name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    contact_phone VARCHAR(50),
    job_title VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    billing_address TEXT NOT NULL,
    shipping_address TEXT,
    tin_number VARCHAR(50),
    photo_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    gender VARCHAR(20),
    birthday DATE,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    FOREIGN KEY (company_id, customer_id)
      REFERENCES customers(company_id, customer_id)
      ON DELETE CASCADE
);