-- Table for project tasks, linked to projects via (company_id, project_id)
CREATE TABLE IF NOT EXISTS project_tasks (
    id BIGSERIAL PRIMARY KEY,
    company_id VARCHAR(20) NOT NULL,
    project_id VARCHAR(32) NOT NULL,
    task_id VARCHAR(32),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(32) DEFAULT 'not_started',
    assignee_id VARCHAR(20),
    priority VARCHAR(32) DEFAULT 'medium',
    start_date DATE,
    due_date DATE,
    progress NUMERIC DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    FOREIGN KEY (company_id, project_id) REFERENCES projects(company_id, project_id) ON DELETE CASCADE,
    FOREIGN KEY (company_id, assignee_id) REFERENCES users(company_id, user_id) ON DELETE SET NULL
);

-- Optional index to speed up project task lookups
CREATE INDEX IF NOT EXISTS idx_project_tasks_company_project ON project_tasks(company_id, project_id);
