-- ========================
-- 1. Core Employees Table
-- ========================
CREATE TABLE employees (
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
    address TEXT,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    PRIMARY KEY (company_id, employee_id)
);

-- ======================================================
-- 2. Employment Details Table (versioned, changing data)
-- ======================================================
CREATE TABLE employee_employment_details (
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
        contract_type VARCHAR(50),
        reports_to VARCHAR(20),
        deputy_manager VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP,
        FOREIGN KEY (company_id, employee_id)
            REFERENCES employees(company_id, employee_id)
            ON DELETE CASCADE
);


contract_type
-- ==========================================
-- 3. Full-Time / Apparent Employee Details
-- ==========================================
CREATE TABLE employee_full_time_details (
    id BIGSERIAL PRIMARY KEY,
    employment_detail_id BIGINT NOT NULL REFERENCES employee_employment_details(id) ON DELETE CASCADE,
    contract_type VARCHAR(50),
    reports_to VARCHAR(20),
    deputy_manager VARCHAR(20)
);

-- ================================
-- 4. Contractor Employee Details
-- ================================
CREATE TABLE employee_contractor_details (
    id BIGSERIAL PRIMARY KEY,
    employment_detail_id BIGINT NOT NULL REFERENCES employee_employment_details(id) ON DELETE CASCADE,
    start_date DATE,
    end_date DATE,
    reports_to VARCHAR(20),
    deputy_manager VARCHAR(20)
);

-- ===============================
-- 5. Part-Time Employee Details
-- ===============================
CREATE TABLE employee_part_time_details (
    id BIGSERIAL PRIMARY KEY,
    employment_detail_id BIGINT NOT NULL REFERENCES employee_employment_details(id) ON DELETE CASCADE,
    part_time_interval VARCHAR(20) CHECK (part_time_interval IN ('weekly','bi_monthly','monthly'))
);

-- ============================================
-- 6. Part-Time Schedule (weekly/bi-monthly/...)
-- ============================================
CREATE TABLE employee_part_time_schedule (
    id BIGSERIAL PRIMARY KEY,
    employment_detail_id BIGINT NOT NULL REFERENCES employee_employment_details(id) ON DELETE CASCADE,
    week_number INT DEFAULT 1,  -- weekly=1; bi_monthly=1-2; monthly=1-4
    day_of_week VARCHAR(10) CHECK (day_of_week IN 
       ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')),
    start_time TIME,
    end_time TIME
);

-- ================================
-- 7. Emergency Contacts (multiple)
-- ================================
CREATE TABLE employee_emergency_contacts (
        id BIGSERIAL PRIMARY KEY,
        company_id VARCHAR(20) NOT NULL,
        employee_id VARCHAR(20) NOT NULL,
        contact_name VARCHAR(255),
        relationship VARCHAR(50),
        phone VARCHAR(50),
        national_id_number VARCHAR(50),
        national_id_attachment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP,
        FOREIGN KEY (company_id, employee_id)
            REFERENCES employees(company_id, employee_id)
            ON DELETE CASCADE
);

-- =================================
-- 8. Skills & Certifications (multiple)
-- =================================
CREATE TABLE employee_skills_certifications (
        id BIGSERIAL PRIMARY KEY,
        company_id VARCHAR(20) NOT NULL,
        employee_id VARCHAR(20) NOT NULL,
        skill_name VARCHAR(100),
        certification_name VARCHAR(100),
        issued_by VARCHAR(100),
        expiry_date DATE,
        attachment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP,
        FOREIGN KEY (company_id, employee_id)
            REFERENCES employees(company_id, employee_id)
            ON DELETE CASCADE
);

-- Migration: create employee_leave_balances table
-- Created: 2025-11-19

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


CREATE UNIQUE INDEX IF NOT EXISTS ux_employee_leave_balances_employee_type
  ON employee_leave_balances(company_id, employee_id, leave_type_key);

CREATE INDEX IF NOT EXISTS idx_employee_leave_balances_employee ON employee_leave_balances(company_id, employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_leave_balances_type ON employee_leave_balances(leave_type_key);
