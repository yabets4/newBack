CREATE TABLE assets (
    company_id VARCHAR(20) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    asset_id VARCHAR(20) NOT NULL,                     -- e.g., ASSET-LATHE-001
    asset_name VARCHAR(255) NOT NULL,                 -- e.g., Industrial Lathe
    category VARCHAR(20) NOT NULL,                 
    location VARCHAR(20) NOT NULL,                 
    serial_number VARCHAR(50) NOT NULL,               -- references locations table
    status VARCHAR(20) NOT NULL,                   
    assigned_to VARCHAR(20),                       -- references employees table (optional)
    acquisition_date DATE NOT NULL,
    acquisition_value DECIMAL(12,2) NOT NULL,
    current_value DECIMAL(12,2),
    depreciation_method VARCHAR(50) NOT NULL,
    useful_life_years INT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (company_id, asset_id)
);
