-- Migration: Create attendance_logs table
-- Created: 2025-10-08

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

CREATE INDEX IF NOT EXISTS idx_attendance_company_employee_date ON attendance_logs(company_id, employee_id, event_date);
CREATE INDEX IF NOT EXISTS idx_attendance_company_date ON attendance_logs(company_id, event_date);
