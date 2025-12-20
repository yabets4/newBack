-- Tasks table for project management
-- Creates a tasks table that depends on projects (company_id, project_id)

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
