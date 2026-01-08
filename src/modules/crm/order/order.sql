-- CRM Orders and Forecasts Schema

-- 1. Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id BIGSERIAL PRIMARY KEY,
    company_id VARCHAR(20) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    order_id VARCHAR(32) NOT NULL, -- ORD-XXX
    quote_id VARCHAR(20),
    lead_id VARCHAR(20),
    status VARCHAR(50) DEFAULT 'Pending',
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    delivery_date DATE,
    delivery_address TEXT,
    total_amount DECIMAL(15,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, order_id)
);

-- 2. Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
    id BIGSERIAL PRIMARY KEY,
    company_id VARCHAR(20) NOT NULL,
    order_id VARCHAR(32) NOT NULL,
    quote_id VARCHAR(20),
    product_name VARCHAR(255) NOT NULL,
    quantity DECIMAL(12,2) DEFAULT 1,
    unit_price DECIMAL(15,2) DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id, order_id) REFERENCES orders(company_id, order_id) ON DELETE CASCADE
);

-- 3. Sales Forecasts Table (for Monte Carlo results)
CREATE TABLE IF NOT EXISTS sales_forecasts (
    id BIGSERIAL PRIMARY KEY,
    company_id VARCHAR(20) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    params JSONB NOT NULL,
    results JSONB NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_company_date ON orders(company_id, order_date);
CREATE INDEX IF NOT EXISTS idx_order_items_lookup ON order_items(company_id, order_id);
