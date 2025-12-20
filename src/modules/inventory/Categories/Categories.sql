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
