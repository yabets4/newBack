-- 1️⃣ Companies
CREATE TABLE IF NOT EXISTS companies (
    company_id VARCHAR(20) PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    token_secret VARCHAR(255),
    next_user_number INT DEFAULT 0,
    next_customer_number INT DEFAULT 0,
    next_lead_number INT DEFAULT 0,   -- used by backend to generate LEAD-XX
    next_asset_number INT DEFAULT 0,   -- used by backend to generate LEAD-XX
    next_raw_material_number INT DEFAULT 0,   -- used by backend to generate LEAD-XX
    next_attendance_number INT DEFAULT 0,   -- used by backend to generate LEAD-XX
    next_tool_assignment_number INT DEFAULT 1,   -- used by backend to generate LEAD-XX
    next_quote_number INT DEFAULT 0,
    next_order_number INT DEFAULT 0,
    next_employee_number INT DEFAULT 0,
    next_product_number INT DEFAULT 0,
    next_ap_invoice_number INT DEFAULT 0,
    next_ar_invoice_number INT NOT NULL DEFAULT 1,
    next_account_number INT NOT NULL DEFAULT 1,
    next_journal_number INT NOT NULL DEFAULT 1,
    next_budget_number INT NOT NULL DEFAULT 0,
    next_account_number INT NOT NULL DEFAULT 0,
);

-- Sequence for company numbers
CREATE SEQUENCE IF NOT EXISTS company_id_seq
START 1
INCREMENT 1
MINVALUE 1;


-- 1. CREATE TABLE IF NOT EXISTS
CREATE TABLE IF NOT EXISTS company_profiles (
    id BIGSERIAL PRIMARY KEY,
    company_id VARCHAR(20) NOT NULL REFERENCES companies(company_id),
    company_name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    registration_number VARCHAR(100),
    physical_address TEXT,
    default_currency VARCHAR(10),
    industry VARCHAR(100),
    business_model VARCHAR(100),
    pricing_tier VARCHAR(50),
    company_logo TEXT,
    tin_document TEXT,
    business_license TEXT,
    trade_license TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'Trial'
        CHECK (status IN ('Active', 'Suspended', 'Deactivated', 'Trial')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS login_sessions (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL,
    gps_lat DOUBLE PRECISION,
    gps_lon DOUBLE PRECISION,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2️⃣ Users (owner + sub-admin)
-- Users table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    company_id VARCHAR(20) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    user_id VARCHAR(20) NOT NULL,  -- USR-XX
    is_system_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (company_id, user_id) -- composite key needed for profile FK
);

-- User Profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id BIGSERIAL PRIMARY KEY,
    company_id VARCHAR(20) NOT NULL,
    user_id VARCHAR(20) NOT NULL,  -- rename to match users.user_id
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    password TEXT NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('owner','sub_admin','staff')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (company_id, user_id)
      REFERENCES users(company_id, user_id)
      ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payments (
    id BIGSERIAL PRIMARY KEY,
    company_id VARCHAR(20) NOT NULL REFERENCES companies(company_id),
    billing_contact_name VARCHAR(255),
    billing_email VARCHAR(255),
    billing_address TEXT,
    payment_method VARCHAR(50),
    payment_details VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 4️⃣ Locations
CREATE TABLE IF NOT EXISTS locations (
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

CREATE TABLE IF NOT EXISTS system_logs (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT NOW(),    -- log creation time
    level VARCHAR(50) NOT NULL,           -- e.g., 'info', 'warn', 'error'
    message TEXT NOT NULL,                -- the log message
    context JSONB                         -- optional structured context (e.g., user, request, extra info)
);

CREATE TABLE IF NOT EXISTS pricing_tiers (
    tier_id VARCHAR(20) PRIMARY KEY, -- unique stable identifier
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pricing_tier_versions (
    id BIGSERIAL PRIMARY KEY,
    tier_id VARCHAR(20) NOT NULL REFERENCES pricing_tiers(tier_id) ON DELETE CASCADE,
    version INT NOT NULL,
    monthly_price NUMERIC(12,2) NOT NULL DEFAULT 0,
    annual_price NUMERIC(12,2) NOT NULL DEFAULT 0,
    included_users INT NOT NULL DEFAULT 1,
    total_customer NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_leads NUMERIC(12,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (tier_id, version) -- ensures one row per version per tier
);
CREATE TABLE IF NOT EXISTS api_request_counts (
    id BIGSERIAL PRIMARY KEY,
    company_id VARCHAR(20) NOT NULL,
    user_id VARCHAR(20) NOT NULL,  -- must match users.user_id
    request_count BIGINT DEFAULT 1,
    last_request TIMESTAMP DEFAULT NOW(),
    UNIQUE (company_id, user_id),
    FOREIGN KEY (company_id, user_id)
      REFERENCES users(company_id, user_id)
      ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS api_route_counts (
    id SERIAL PRIMARY KEY,
    route VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    request_count BIGINT DEFAULT 1,
    last_request TIMESTAMP DEFAULT NOW(),
    UNIQUE (route, method)
);


CREATE TABLE IF NOT EXISTS admin_users (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(50) UNIQUE NOT NULL,  -- custom ID for the admin
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    password TEXT NOT NULL,               -- store hashed passwords only
    role VARCHAR(50) DEFAULT 'admin',     -- e.g., 'superadmin', 'admin', 'moderator'
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_login_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL,
    gps_lat DECIMAL(9,6),   -- supports precision up to ~11cm
    gps_lon DECIMAL(9,6),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_rbac (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    roles JSONB NOT NULL, -- could be a single role or JSON/array for multiple roles
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    permissions JSON NOT NULL
);

CREATE TABLE IF NOT EXISTS roles (
    id BIGSERIAL PRIMARY KEY,
    company_id VARCHAR(20) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (company_id, name)
);

CREATE TABLE IF NOT EXISTS permissions (
    id BIGSERIAL PRIMARY KEY,
    company_id VARCHAR(20) REFERENCES companies(company_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (company_id, name)
);


CREATE TABLE IF NOT EXISTS rbac (
    id BIGSERIAL PRIMARY KEY,
    company_id VARCHAR(20) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    user_id VARCHAR(20) NOT NULL,
    roles JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (company_id, user_id),
    FOREIGN KEY (company_id, user_id) REFERENCES users(company_id, user_id) ON DELETE CASCADE
);


CREATE INDEX IF NOT EXISTS idx_roles_company ON roles(company_id);
CREATE INDEX IF NOT EXISTS idx_permissions_company ON permissions(company_id);
CREATE INDEX IF NOT EXISTS idx_rbac_company_user ON rbac(company_id, user_id);


--crm Tables
-- Customers
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

-- Leads
CREATE TABLE IF NOT EXISTS leads (
    company_id VARCHAR(20) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    customer_id VARCHAR(20),
    lead_id VARCHAR(20) NOT NULL,  -- LEAD-XX
    lead_type VARCHAR(20) NOT NULL CHECK (lead_type IN ('Individual', 'Company')),
    name VARCHAR(255) NOT NULL,
    primary_phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    contact_person_name VARCHAR(255),
    contact_person_number VARCHAR(255),
    contact_person_job VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (company_id, lead_id)
);

CREATE TABLE IF NOT EXISTS leads_profile (
    id BIGSERIAL PRIMARY KEY,
    company_id VARCHAR(20) NOT NULL,
    lead_id VARCHAR(20) NOT NULL,
    assigned_to VARCHAR(100) NOT NULL,
    lead_source VARCHAR(100) NOT NULL,
    referred_by VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'New',
    priority VARCHAR(20) NOT NULL DEFAULT 'Medium',
    service_requested VARCHAR(255) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id, lead_id)
      REFERENCES leads(company_id, lead_id)
      ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS leads_attachments (
    id BIGSERIAL PRIMARY KEY,
    company_id VARCHAR(20) NOT NULL,
    lead_id VARCHAR(20) NOT NULL,
    file_url TEXT NOT NULL,
    description TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id, lead_id)
      REFERENCES leads(company_id, lead_id)
      ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS quotes (
    company_id VARCHAR(20) NOT NULL 
        REFERENCES companies(company_id) ON DELETE CASCADE,

    lead_id VARCHAR(20) NOT NULL,   -- link to LEAD-XX

    quote_id VARCHAR(20) NOT NULL,  -- QUO-XX

    service_inquired VARCHAR(255) NOT NULL,

    discount_percent DECIMAL(5,2),
    tax_rate DECIMAL(5,2) DEFAULT 15.00,

    expiration_date DATE NOT NULL,

    internal_margin_percent DECIMAL(5,2),

    version INT DEFAULT 1,
    status VARCHAR(50) DEFAULT 'Draft',

    payment_terms VARCHAR(255) NOT NULL,
    delivery_terms VARCHAR(255) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (company_id, quote_id),

    FOREIGN KEY (company_id, lead_id)
        REFERENCES leads(company_id, lead_id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS quote_items (
    id BIGSERIAL PRIMARY KEY,
    company_id VARCHAR(20) NOT NULL,
    quote_id VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL, -- Product or service name
    quantity INT DEFAULT 1,
    unit_price DECIMAL(12,2) DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id, quote_id)
      REFERENCES quotes(company_id, quote_id)
      ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS quote_item_attachments (
    id BIGSERIAL PRIMARY KEY,
    company_id VARCHAR(20) NOT NULL,
    quote_item_id BIGINT NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(50), -- PDF, DOCX, STL, OBJ
    description TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (quote_item_id)
      REFERENCES quote_items(id)
      ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS quote_attachments (
    id BIGSERIAL PRIMARY KEY,
    company_id VARCHAR(20) NOT NULL,
    quote_id VARCHAR(20) NOT NULL,
    file_url TEXT NOT NULL,
    description TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id, quote_id)
      REFERENCES quotes(company_id, quote_id)
      ON DELETE CASCADE
);

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


--HR Tables
CREATE TABLE IF NOT EXISTS employees (
    company_id VARCHAR(20) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    employee_id VARCHAR(20) NOT NULL,  -- EMP-XX
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone_number VARCHAR(50),
    profile_photo_url TEXT,
    date_of_birth DATE,
    gender VARCHAR(20),
    nationality VARCHAR(50),
    marital_status VARCHAR(20),
    national_id_number VARCHAR(50),
    national_id_attachment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (company_id, employee_id)
);

CREATE TABLE IF NOT EXISTS employee_employment_details (
    id BIGSERIAL PRIMARY KEY,
    company_id VARCHAR(20) NOT NULL,
    employee_id VARCHAR(20) NOT NULL,
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    work_location VARCHAR(100),
    department VARCHAR(100),
    job_title VARCHAR(100),
    hire_date DATE,
    employee_type VARCHAR(20) NOT NULL CHECK (employee_type IN ('full_time','contractor','part_time')),
    base_salary NUMERIC(12,2),
    pay_frequency VARCHAR(20),
    bank_name VARCHAR(100),
    bank_account_number VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id, employee_id)
      REFERENCES employees(company_id, employee_id)
      ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS employee_full_time_details (
    id BIGSERIAL PRIMARY KEY,
    employment_detail_id BIGINT NOT NULL REFERENCES employee_employment_details(id) ON DELETE CASCADE,
    contract_type VARCHAR(50),
    reports_to VARCHAR(20),
    deputy_manager VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS employee_contractor_details (
    id BIGSERIAL PRIMARY KEY,
    employment_detail_id BIGINT NOT NULL REFERENCES employee_employment_details(id) ON DELETE CASCADE,
    start_date DATE,
    end_date DATE,
    reports_to VARCHAR(20),
    deputy_manager VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS employee_part_time_details (
    id BIGSERIAL PRIMARY KEY,
    employment_detail_id BIGINT NOT NULL REFERENCES employee_employment_details(id) ON DELETE CASCADE,
    part_time_interval VARCHAR(20) CHECK (part_time_interval IN ('weekly','bi_monthly','monthly'))
);

CREATE TABLE IF NOT EXISTS employee_part_time_schedule (
    id BIGSERIAL PRIMARY KEY,
    employment_detail_id BIGINT NOT NULL REFERENCES employee_employment_details(id) ON DELETE CASCADE,
    week_number INT DEFAULT 1,  -- weekly=1; bi_monthly=1-2; monthly=1-4
    day_of_week VARCHAR(10) CHECK (day_of_week IN 
       ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')),
    start_time TIME,
    end_time TIME
);

CREATE TABLE IF NOT EXISTS employee_emergency_contacts (
    id BIGSERIAL PRIMARY KEY,
    company_id VARCHAR(20) NOT NULL,
    employee_id VARCHAR(20) NOT NULL,
    contact_name VARCHAR(255),
    relationship VARCHAR(50),
    phone VARCHAR(50),
    national_id_number VARCHAR(50),
    national_id_attachment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id, employee_id)
      REFERENCES employees(company_id, employee_id)
      ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS employee_skills_certifications (
    id BIGSERIAL PRIMARY KEY,
    company_id VARCHAR(20) NOT NULL,
    employee_id VARCHAR(20) NOT NULL,
    skill_name VARCHAR(100),
    certification_name VARCHAR(100),
    issued_by VARCHAR(100),
    expiry_date DATE,
    attachment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id, employee_id)
      REFERENCES employees(company_id, employee_id)
      ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS attendance_logs (
    company_id VARCHAR(20) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    attendance_id VARCHAR(40) NOT NULL,
    employee_id VARCHAR(20) NOT NULL,
    event_date DATE NOT NULL,
    clock_in_time TIME,
    clock_out_time TIME,
    break_start_time TIME,
    break_end_time TIME,
    total_hours NUMERIC(6,2) DEFAULT 0,
    status VARCHAR(50), -- e.g., Present, Absent, Late, Early Out, On Leave
    notes TEXT,
    location VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    PRIMARY KEY (company_id, attendance_id)
);

-- Departments and Jobs tables
CREATE TABLE IF NOT EXISTS departments (
    id BIGSERIAL PRIMARY KEY,
    company_id VARCHAR(20) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    department_id VARCHAR(32) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (company_id, department_id),
    UNIQUE (company_id, name)
);

CREATE TABLE IF NOT EXISTS jobs (
    id BIGSERIAL PRIMARY KEY,
    company_id VARCHAR(20) NOT NULL,
    department_id VARCHAR(32) NOT NULL,
    job_id VARCHAR(32) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    salary_from NUMERIC(12,2),
    salary_to NUMERIC(12,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (company_id, department_id, job_id),
    FOREIGN KEY (company_id, department_id) REFERENCES departments(company_id, department_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS leave_requests (
    id BIGSERIAL PRIMARY KEY,
    company_id VARCHAR(20) NOT NULL,
    employee_id VARCHAR(20) NOT NULL,
    leave_type VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    number_of_days INT GENERATED ALWAYS AS (end_date - start_date + 1) STORED,
    reason TEXT,
    approver_comments TEXT,
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending','Approved','Rejected')),
    created_by VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id, employee_id)
        REFERENCES employees(company_id, employee_id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_leave_requests_company ON leave_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);

CREATE TABLE employee_leave_balances (
    id BIGSERIAL PRIMARY KEY,
    company_id VARCHAR(20) NOT NULL,
    employee_id VARCHAR(20) NOT NULL,
    leave_type VARCHAR(100) NOT NULL,
    leave_type_key VARCHAR(100),     
    total_days INT DEFAULT 0,
    remaining_days INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (company_id, employee_id)
        REFERENCES employees(company_id, employee_id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS offboarding_templates (
  id SERIAL PRIMARY KEY,
  company_id VARCHAR(20) NOT NULL,
  template_id VARCHAR(50) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  tasks JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_offboarding_templates_company_template ON offboarding_templates(company_id, template_id);

CREATE TABLE IF NOT EXISTS offboarding_processes (
  id SERIAL PRIMARY KEY,
  company_id VARCHAR(20) NOT NULL,
  process_id VARCHAR(50) NOT NULL,
  employee_id VARCHAR(20),
  template_id VARCHAR(50),
  start_date DATE,
  status TEXT DEFAULT 'in_progress',
  tasks JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
  FOREIGN KEY (company_id, employee_id) REFERENCES employees(company_id, employee_id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_offboarding_processes_company_process ON offboarding_processes(company_id, process_id);

CREATE TABLE IF NOT EXISTS onboarding_templates (
  id SERIAL PRIMARY KEY,
  company_id VARCHAR(20) NOT NULL,
  template_id VARCHAR(50) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  tasks JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_onboarding_templates_company_template ON onboarding_templates(company_id, template_id);

CREATE TABLE IF NOT EXISTS onboarding_processes (
  id SERIAL PRIMARY KEY,
  company_id VARCHAR(20) NOT NULL,
  process_id VARCHAR(50) NOT NULL,
  employee_id VARCHAR(20),
  template_id VARCHAR(50),
  employee_name TEXT,
  employee_department TEXT,
  template_name TEXT,
  start_date DATE,
  status TEXT DEFAULT 'in_progress',
  tasks JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
  FOREIGN KEY (company_id, employee_id) REFERENCES employees(company_id, employee_id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_onboarding_processes_company_process ON onboarding_processes(company_id, process_id);

CREATE TABLE IF NOT EXISTS performance_reviews (
  id SERIAL PRIMARY KEY,
  company_id VARCHAR(20) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
  review_id TEXT NOT NULL,
  employee_id VARCHAR(20) NOT NULL,
  reviewer_id VARCHAR(20),
  review_date DATE,
  period_start DATE,
  period_end DATE,
  score NUMERIC,
  summary TEXT,
  details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id, review_id),
  FOREIGN KEY (company_id, employee_id) REFERENCES employees(company_id, employee_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS performance_feedback (
  id SERIAL PRIMARY KEY,
  company_id VARCHAR(20) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
  feedback_id TEXT NOT NULL,
  from_employee_id VARCHAR(20),
  to_employee_id VARCHAR(20),
  date DATE,
  type TEXT,
  content TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id, feedback_id),
  FOREIGN KEY (company_id, from_employee_id) REFERENCES employees(company_id, employee_id) ON DELETE SET NULL,
  FOREIGN KEY (company_id, to_employee_id) REFERENCES employees(company_id, employee_id) ON DELETE SET NULL
);


CREATE TABLE IF NOT EXISTS shift (
  id serial PRIMARY KEY,
  shift_id varchar(64) UNIQUE,
  company_id varchar(64),
  employee_id varchar(64) NOT NULL,
  shift_date date NOT NULL,
  start_time time,
  end_time time,
  employee_name VARCHAR(255),
  type varchar(64),
  location_name varchar(255),
  notes text,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_shift_employee_id ON shift(employee_id);
CREATE INDEX IF NOT EXISTS idx_shift_company_id ON shift(company_id);
CREATE INDEX IF NOT EXISTS idx_shift_date ON shift(shift_date);

CREATE TABLE audit_logs (
    audit_id BIGSERIAL PRIMARY KEY,
    company_id VARCHAR(20) NOT NULL,
    user_id VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    endpoint TEXT NOT NULL,           
    record_id TEXT, 
    ip_address TEXT,                    
    user_agent TEXT,
    action TEXT NOT NULL,
    before_data JSONB,              
    after_data JSONB,
    details TEXT,
    FOREIGN KEY (company_id, user_id)
        REFERENCES users(company_id, user_id)
        ON DELETE CASCADE
);

CREATE INDEX idx_audit_company ON audit_logs(company_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_record ON audit_logs(record_id);
CREATE INDEX idx_audit_when ON audit_logs(created_at);


-- Inventory and Assets Tables

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


-- Categories lookup table
CREATE TABLE IF NOT EXISTS categories (
    company_id VARCHAR(20) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    category_id VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    PRIMARY KEY (company_id, category_id)
);

CREATE TABLE IF NOT EXISTS units_of_measure (
    company_id VARCHAR(20) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    uom_id VARCHAR(20) NOT NULL,
    name VARCHAR(50) NOT NULL,
    PRIMARY KEY (company_id, uom_id)
);


CREATE TABLE IF NOT EXISTS raw_materials (
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

CREATE TABLE IF NOT EXISTS raw_materials_profile (
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

CREATE TABLE IF NOT EXISTS assets (
    company_id VARCHAR(20) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    asset_id VARCHAR(20) NOT NULL,                     -- e.g., ASSET-LATHE-001
    asset_name VARCHAR(255) NOT NULL,                 -- e.g., Industrial Lathe
    category VARCHAR(20) NOT NULL,                 
    location VARCHAR(20) NOT NULL,                 
    serial_number VARCHAR(50) NOT NULL,               -- references locations table
    status VARCHAR(20) NOT NULL,                   
    assigned_to VARCHAR(20),                       
    acquisition_date DATE NOT NULL,
    acquisition_value DECIMAL(12,2) NOT NULL,
    current_value DECIMAL(12,2),
    depreciation_method VARCHAR(50) NOT NULL,
    useful_life_years INT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (company_id, asset_id)
);

CREATE TABLE IF NOT EXISTS raw_material_movements (
    movement_id BIGSERIAL PRIMARY KEY,
    company_id VARCHAR(20) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    raw_material_id VARCHAR(20) NOT NULL,
    movement_type VARCHAR(20) NOT NULL, -- 'Inbound', 'Outbound', 'Transfer', 'Adjustment'
    quantity DECIMAL(10, 2) NOT NULL,
    movement_date DATE NOT NULL,
    
    -- Inbound specific
    source_document VARCHAR(100), -- e.g., PO number
    supplier VARCHAR(255),

    -- Outbound specific
    destination_document VARCHAR(100), -- e.g., Production Order
    department_or_project VARCHAR(100),

    -- Transfer specific
    from_location VARCHAR(255),
    to_location VARCHAR(255),

    -- Adjustment specific
    adjustment_type VARCHAR(20), -- 'Increase', 'Decrease'
    adjustment_reason VARCHAR(255),

    notes TEXT,
    responsible_person VARCHAR(100),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (company_id, raw_material_id) REFERENCES raw_materials(company_id, raw_material_id)
);

CREATE OR REPLACE FUNCTION update_raw_material_stock()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.movement_type = 'Inbound' OR (NEW.movement_type = 'Adjustment' AND NEW.adjustment_type = 'Increase') THEN
            UPDATE raw_materials
            SET current_stock = current_stock + NEW.quantity
            WHERE company_id = NEW.company_id AND raw_material_id = NEW.raw_material_id;
        ELSIF NEW.movement_type = 'Outbound' OR (NEW.movement_type = 'Adjustment' AND NEW.adjustment_type = 'Decrease') THEN
            UPDATE raw_materials
            SET current_stock = current_stock - NEW.quantity
            WHERE company_id = NEW.company_id AND raw_material_id = NEW.raw_material_id;
        END IF;
        -- For 'Transfer', stock level doesn't change globally, only location.
    ELSIF TG_OP = 'DELETE' THEN
        -- Revert the stock change on deletion of a movement
        IF OLD.movement_type = 'Inbound' OR (OLD.movement_type = 'Adjustment' AND OLD.adjustment_type = 'Increase') THEN
            UPDATE raw_materials
            SET current_stock = current_stock - OLD.quantity
            WHERE company_id = OLD.company_id AND raw_material_id = OLD.raw_material_id;
        ELSIF OLD.movement_type = 'Outbound' OR (OLD.movement_type = 'Adjustment' AND OLD.adjustment_type = 'Decrease') THEN
            UPDATE raw_materials
            SET current_stock = current_stock + OLD.quantity
            WHERE company_id = OLD.company_id AND raw_material_id = OLD.raw_material_id;
        END IF;
    END IF;
    RETURN NULL; -- result is ignored since this is an AFTER trigger
END;
$$ LANGUAGE plpgsql;

-- Attach the trigger to the movements table
DROP TRIGGER IF EXISTS stock_update_trigger ON raw_material_movements;

CREATE TRIGGER stock_update_trigger
AFTER INSERT OR DELETE
ON raw_material_movements
FOR EACH ROW
EXECUTE FUNCTION update_raw_material_stock();


CREATE TABLE IF NOT EXISTS tools_machinery (
    id SERIAL PRIMARY KEY,
    company_id VARCHAR(20) NOT NULL,
    asset_id VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    serial_number VARCHAR(100),
    manufacturer VARCHAR(100),
    model_number VARCHAR(100),
    purchase_date DATE,
    cost NUMERIC(15, 2) NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'Operational',
    location VARCHAR(100) NOT NULL,
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    assigned_to VARCHAR(100),
    notes TEXT,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE
);

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='next_project_number') THEN
        ALTER TABLE companies ADD COLUMN next_project_number INTEGER DEFAULT 1;
    END IF;
END $$;

-- Project Management Tables

CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    company_id VARCHAR(20) NOT NULL,
    project_id VARCHAR(32) NOT NULL,
    name VARCHAR(160) NOT NULL,
    type VARCHAR(64),
    linked_sales_order_id VARCHAR(32),
    customer VARCHAR(160),
    manager_id VARCHAR(20),
    department VARCHAR(64),
    description TEXT,
    status VARCHAR(32) DEFAULT 'planned',
    start_date DATE,
    due_date DATE,
    priority_level VARCHAR(32),
    production_location VARCHAR(128),
    delivery_location VARCHAR(128),
    linked_showroom_or_project_site VARCHAR(128),
    linked_design_file_template_id VARCHAR(64),
    linked_products TEXT,
    bill_of_materials_version VARCHAR(64),
    custom_requirements_uploads TEXT,
    role_or_skill_tags TEXT,
    required_tool_types TEXT,
    tool_quantity_reservation_window VARCHAR(128),
    trigger_material_request VARCHAR(16),
    estimated_labor_cost NUMERIC,
    estimated_overhead NUMERIC,
    estimated_profit_margin NUMERIC,
    payment_received_deposit_status VARCHAR(32),
    qc_checkpoints TEXT,
    qc_responsible_employee_id VARCHAR(20),
    known_risks_warnings TEXT,
    notes_instructions TEXT,
    customer_comments TEXT,
    design_approval_needed VARCHAR(8),
    approval_chain TEXT,
    budget NUMERIC,
    progress NUMERIC,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(company_id, project_id),
    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    FOREIGN KEY (company_id, linked_sales_order_id) REFERENCES orders(company_id, order_id) ON DELETE SET NULL,
    FOREIGN KEY (company_id, manager_id) REFERENCES users(company_id, user_id) ON DELETE SET NULL
);

-- 3. Project items/tasks table (unchanged)
CREATE TABLE IF NOT EXISTS project_items (
    id SERIAL PRIMARY KEY,
    company_id VARCHAR(20) NOT NULL,
    project_id VARCHAR(32) NOT NULL,
    name VARCHAR(160) NOT NULL,
    description TEXT,
    status VARCHAR(32) DEFAULT 'pending',
    assignee_id VARCHAR(20),
    due_date DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    FOREIGN KEY (company_id, project_id) REFERENCES projects(company_id, project_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS project_team_members (
    id SERIAL PRIMARY KEY,
    company_id VARCHAR(20) NOT NULL,
    project_id VARCHAR(32) NOT NULL,
    employee_id VARCHAR(20) NOT NULL,
    role_or_skill_tags TEXT,
    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    FOREIGN KEY (company_id, project_id) REFERENCES projects(company_id, project_id) ON DELETE CASCADE,
    FOREIGN KEY (company_id, employee_id) REFERENCES employees(company_id, employee_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS project_tool_assignments (
    id SERIAL PRIMARY KEY,
    company_id VARCHAR(20) NOT NULL,
    project_id VARCHAR(32) NOT NULL,
    tool_id INT NOT NULL,   -- now properly linked
    assigned_employee_id VARCHAR(20),
    start_date DATE,
    end_date DATE,
    start_time VARCHAR(16),
    end_time VARCHAR(16),
    status VARCHAR(50) DEFAULT 'Assigned',
    notes TEXT,

    FOREIGN KEY (company_id) 
        REFERENCES companies(company_id) 
        ON DELETE CASCADE,

    FOREIGN KEY (company_id, project_id) 
        REFERENCES projects(company_id, project_id) 
        ON DELETE CASCADE,

    FOREIGN KEY (company_id, assigned_employee_id) 
        REFERENCES employees(company_id, employee_id) 
        ON DELETE SET NULL,

    FOREIGN KEY (tool_id) 
        REFERENCES tools_machinery(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS project_uploaded_files (
    id SERIAL PRIMARY KEY,
    company_id VARCHAR(20) NOT NULL,
    project_id VARCHAR(32) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT,
    uploaded_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    FOREIGN KEY (company_id, project_id) REFERENCES projects(company_id, project_id) ON DELETE CASCADE
);
    
CREATE SEQUENCE IF NOT EXISTS tasks_id_seq START 1;

CREATE TABLE IF NOT EXISTS tasks (
    id BIGSERIAL PRIMARY KEY,
    task_id VARCHAR(32) UNIQUE,
    company_id VARCHAR(20) NOT NULL,
    project_id VARCHAR(32) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'Not Started',
    priority VARCHAR(32) DEFAULT 'Medium',
    assignee_id VARCHAR(20),
    start_date DATE,
    due_date DATE,
    progress INT DEFAULT 0,
    qc_required BOOLEAN DEFAULT FALSE,
    qc_result VARCHAR(32),
    rework_reason TEXT,
    labor_hours NUMERIC DEFAULT 0,
    material_costs NUMERIC DEFAULT 0,
    incentive NUMERIC DEFAULT 0,
    penalty NUMERIC DEFAULT 0,
    materials_used JSONB,
    tools_used JSONB,
    duration INT,
    dependencies JSONB,
    rework_of_task_id VARCHAR(32),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    FOREIGN KEY (company_id, project_id) REFERENCES projects(company_id, project_id) ON DELETE CASCADE,
    FOREIGN KEY (company_id, assignee_id) REFERENCES users(company_id, user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS maintenance_records (
  id bigserial PRIMARY KEY,
  company_id VARCHAR(20) NOT NULL,
  maintenance_type varchar(100) NOT NULL,
  related_type varchar(50) NOT NULL, -- e.g. 'fixed_asset', 'tool', 'machine'
  related_id varchar(200) NOT NULL,
  maintenance_date date,
  description text,
  cost numeric(12,2) DEFAULT 0,
  performed_by varchar(200),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz,
  FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_maintenance_company ON maintenance_records(company_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_related ON maintenance_records(related_type, related_id);


-- Financial Tables

CREATE TABLE IF NOT EXISTS ap_invoices (
  company_id VARCHAR(20) NOT NULL,
  invoice_id TEXT NOT NULL,
  invoice_number TEXT,
  vendor_id VARCHAR(64) NULL,
  vendor_name TEXT NULL,
  invoice_date DATE,
  due_date DATE,
  description TEXT,
  total_amount NUMERIC(18,2) DEFAULT 0,
  status TEXT DEFAULT 'Draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (company_id, invoice_id),
  FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ap_invoice_lines (
  company_id VARCHAR(20) NOT NULL,
  invoice_id TEXT NOT NULL,
  line_number INTEGER NOT NULL,
  po_id TEXT NULL,
  grn_id TEXT NULL,
  item_id TEXT NULL,
  description TEXT NULL,
  quantity NUMERIC DEFAULT 0,
  unit_price NUMERIC DEFAULT 0,
  line_amount NUMERIC DEFAULT 0,
  PRIMARY KEY (company_id, invoice_id, line_number),
  FOREIGN KEY (company_id, invoice_id) REFERENCES ap_invoices(company_id, invoice_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ap_discrepancies (
  id BIGSERIAL PRIMARY KEY,
  company_id VARCHAR(20) NOT NULL,
  invoice_id TEXT NOT NULL,
  line_number INTEGER NULL,
  type VARCHAR(50) NOT NULL,
  message TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ap_invoice_attachments (
  id BIGSERIAL PRIMARY KEY,
  company_id VARCHAR(20) NOT NULL,
  invoice_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  storage_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (company_id, invoice_id) REFERENCES ap_invoices(company_id, invoice_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ap_invoices_company ON ap_invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_ap_invoice_lines_company_invoice ON ap_invoice_lines(company_id, invoice_id);
CREATE INDEX IF NOT EXISTS idx_ap_discrepancies_company_invoice ON ap_discrepancies(company_id, invoice_id);

CREATE TABLE IF NOT EXISTS ar_invoices (
  company_id VARCHAR(20) NOT NULL,
  invoice_id TEXT NOT NULL,
  invoice_number TEXT,
  customer_id VARCHAR(64) NULL,
  customer_name TEXT NULL,
  invoice_date DATE,
  due_date DATE,
  description TEXT,
  total_amount NUMERIC(18,2) DEFAULT 0,
  status TEXT DEFAULT 'Draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (company_id, invoice_id),
  FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ar_invoice_lines (
  company_id VARCHAR(20) NOT NULL,
  invoice_id TEXT NOT NULL,
  line_number INTEGER NOT NULL,
  item_id TEXT NULL,
  description TEXT NULL,
  quantity NUMERIC DEFAULT 0,
  unit_price NUMERIC DEFAULT 0,
  line_amount NUMERIC DEFAULT 0,
  PRIMARY KEY (company_id, invoice_id, line_number),
  FOREIGN KEY (company_id, invoice_id) REFERENCES ar_invoices(company_id, invoice_id) ON DELETE CASCADE
);

-- Payments (receipts) against AR invoices
CREATE TABLE IF NOT EXISTS ar_payments (
  id BIGSERIAL PRIMARY KEY,
  company_id VARCHAR(20) NOT NULL,
  invoice_id TEXT NOT NULL,
  payment_date DATE NULL,
  amount NUMERIC(18,2) DEFAULT 0,
  method TEXT NULL,
  reference TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Attachments for AR invoices
CREATE TABLE IF NOT EXISTS ar_invoice_attachments (
  id BIGSERIAL PRIMARY KEY,
  company_id VARCHAR(20) NOT NULL,
  invoice_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  storage_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (company_id, invoice_id) REFERENCES ar_invoices(company_id, invoice_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ar_invoices_company ON ar_invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_ar_invoice_lines_company_invoice ON ar_invoice_lines(company_id, invoice_id);
CREATE INDEX IF NOT EXISTS idx_ar_payments_company_invoice ON ar_payments(company_id, invoice_id);

CREATE TABLE IF NOT EXISTS chart_of_accounts (
    company_id VARCHAR(20) NOT NULL,
    account_id VARCHAR(20) NOT NULL, -- e.g. ACC-0001
    account_number VARCHAR(100),     -- human-readable number/code
    account_name VARCHAR(255) NOT NULL,
    account_type VARCHAR(50),        -- Asset, Liability, Equity, Revenue, Expense
    description TEXT,
    parent_id VARCHAR(20),           -- parent account_id within same company
    balance NUMERIC DEFAULT 0,       -- current balance (could be updated by posting jobs)
    is_cash_flow_relevant BOOLEAN DEFAULT FALSE,
    is_control_account BOOLEAN DEFAULT FALSE,
    is_system BOOLEAN DEFAULT FALSE, -- protected system account that cannot be deleted
    status VARCHAR(50) DEFAULT 'Active',
    report_group VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (company_id, account_id),
    UNIQUE (company_id, account_number),
    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    FOREIGN KEY (company_id, parent_id) REFERENCES chart_of_accounts(company_id, account_id) ON DELETE RESTRICT
);

-- Helpful index for lookups by number/name
CREATE INDEX IF NOT EXISTS idx_coa_company_account_number ON chart_of_accounts(company_id, account_number);
CREATE INDEX IF NOT EXISTS idx_coa_company_account_name ON chart_of_accounts(company_id, account_name);

CREATE TABLE IF NOT EXISTS currencies (
  company_id VARCHAR(20) NOT NULL,
  id TEXT NOT NULL,
  code TEXT NOT NULL,
  name TEXT,
  symbol TEXT,
  is_base_currency BOOLEAN DEFAULT FALSE,
  decimal_places INTEGER DEFAULT 2,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by TEXT,
  PRIMARY KEY (company_id, id),
  FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS currency_exchange_rates (
  id BIGSERIAL PRIMARY KEY,
  company_id VARCHAR(20) NOT NULL,
  currency_id TEXT NOT NULL,
  rate_date DATE,
  rate NUMERIC(18,6),
  to_currency TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (company_id, currency_id) REFERENCES currencies(company_id, id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_currencies_company ON currencies(company_id);
CREATE INDEX IF NOT EXISTS idx_currency_rates_company_currency ON currency_exchange_rates(company_id, currency_id);


DO $$
BEGIN
  BEGIN
    ALTER TABLE companies ADD COLUMN next_journal_number INT NOT NULL DEFAULT 1;
  EXCEPTION WHEN duplicate_column THEN
    -- column already exists, do nothing
  END;
END$$;

-- Create journal_entries table
CREATE TABLE IF NOT EXISTS journal_entries (
  company_id VARCHAR(20) NOT NULL,
  journal_id TEXT NOT NULL,
  journal_number TEXT,
  journal_date DATE,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'Draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (company_id, journal_id),
  FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE
);

-- Create journal_lines table
CREATE TABLE IF NOT EXISTS journal_lines (
  company_id VARCHAR(20) NOT NULL,
  journal_id TEXT NOT NULL,
  line_number INTEGER NOT NULL,
  account_id TEXT,
  description TEXT,
  debit NUMERIC DEFAULT 0,
  credit NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (company_id, journal_id, line_number),
  FOREIGN KEY (company_id, journal_id) REFERENCES journal_entries(company_id, journal_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_journal_entries_company_status ON journal_entries(company_id, status);
CREATE INDEX IF NOT EXISTS idx_journal_lines_company_journal ON journal_lines(company_id, journal_id);


-- 2. Create ledger_entries table
CREATE TABLE IF NOT EXISTS ledger_entries (
  id BIGSERIAL PRIMARY KEY,
  company_id VARCHAR(20) NOT NULL,
  journal_id VARCHAR(64) NULL,
  journal_line_number INTEGER NULL,
  posting_date DATE DEFAULT CURRENT_DATE,
  account_id VARCHAR(64) NOT NULL,
  debit NUMERIC(18,2) DEFAULT 0 NOT NULL,
  credit NUMERIC(18,2) DEFAULT 0 NOT NULL,
  amount NUMERIC(18,2) NOT NULL,
  running_balance NUMERIC(18,2) DEFAULT 0 NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ledger_company_account ON ledger_entries(company_id, account_id);

-- 3. Create ledger_balances table
CREATE TABLE IF NOT EXISTS ledger_balances (
  company_id VARCHAR(20) NOT NULL,
  account_id VARCHAR(64) NOT NULL,
  balance NUMERIC(18,2) DEFAULT 0 NOT NULL,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (company_id, account_id)
);

-- 4. Create journal_mappings table
CREATE TABLE IF NOT EXISTS journal_mappings (
  id BIGSERIAL PRIMARY KEY,
  company_id VARCHAR(20) NOT NULL,
  event_type VARCHAR(128) NOT NULL,
  debit_account_id VARCHAR(64) NOT NULL,
  credit_account_id VARCHAR(64) NOT NULL,
  amount_formula TEXT NULL,
  description_template TEXT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, event_type)
);

-- 5. Add SQL constraints to journal_lines
ALTER TABLE IF EXISTS journal_lines
  ADD CONSTRAINT chk_journal_lines_debit_credit_nonnegative CHECK ((debit >= 0) AND (credit >= 0));

ALTER TABLE IF EXISTS journal_lines
  ADD CONSTRAINT chk_journal_lines_one_side_nonzero CHECK ((debit = 0 OR credit = 0));

ALTER TABLE IF EXISTS journal_lines
  ADD CONSTRAINT chk_journal_lines_not_both_zero CHECK (NOT (debit = 0 AND credit = 0));

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_journal_lines_account'
  ) THEN
    ALTER TABLE journal_lines
      ADD CONSTRAINT fk_journal_lines_account FOREIGN KEY (company_id, account_id)
      REFERENCES chart_of_accounts(company_id, account_id)
      ON DELETE RESTRICT;
  END IF;
END$$;

-- 7. Prevent deletion of posted journal_entries via trigger
CREATE OR REPLACE FUNCTION prevent_delete_posted_journal() RETURNS trigger AS $$
BEGIN
  IF OLD.status = 'Posted' THEN
    RAISE EXCEPTION 'Cannot delete posted journal entry';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_delete_posted ON journal_entries;
CREATE TRIGGER trg_prevent_delete_posted
  BEFORE DELETE ON journal_entries
  FOR EACH ROW
  EXECUTE PROCEDURE prevent_delete_posted_journal();

-- 8. Ensure journal_entries.journal_id is unique per company
ALTER TABLE IF EXISTS journal_entries
  ADD CONSTRAINT uq_company_journal_id UNIQUE (company_id, journal_id);
