CREATE TABLE IF NOT EXISTS companies (
    company_id VARCHAR(20) PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    token_secret VARCHAR(255) NOT NULL,
    next_user_number INT DEFAULT 1,
    next_customer_number INT DEFAULT 0,
    next_lead_number INT DEFAULT 0,   -- used by backend to generate LEAD-XX
    next_asset_number INT DEFAULT 0,   -- used by backend to generate LEAD-XX
    next_raw_material_number INT DEFAULT 0,   -- used by backend to generate LEAD-XX
    next_attendance_number INT DEFAULT 0,   -- used by backend to generate LEAD-XX
    next_tool_assignment_number INT DEFAULT 1,   -- used by backend to generate LEAD-XX
    next_quote_number INT DEFAULT 0,
    next_order_number INT DEFAULT 0,
    next_employee_number INT DEFAULT 0,
);