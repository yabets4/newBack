-- Migration: create leave_requests table (global, non-prefixed)
-- Created: 2025-11-19

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


