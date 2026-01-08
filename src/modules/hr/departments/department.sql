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

CREATE TABLE IF NOT EXISTS job_levels (
    id BIGSERIAL PRIMARY KEY,
    company_id VARCHAR(20) NOT NULL,
    department_id VARCHAR(32) NOT NULL,
    job_id VARCHAR(32) NOT NULL,
    level_id VARCHAR(32) NOT NULL,
    level_name VARCHAR(255) NOT NULL,
    level_order INTEGER NOT NULL,
    promotion_condition TEXT,
    min_salary NUMERIC(12,2),
    max_salary NUMERIC(12,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (company_id, department_id, job_id, level_id),
    UNIQUE (company_id, department_id, job_id, level_order),
    FOREIGN KEY (company_id, department_id, job_id) REFERENCES jobs(company_id, department_id, job_id) ON DELETE CASCADE
);
