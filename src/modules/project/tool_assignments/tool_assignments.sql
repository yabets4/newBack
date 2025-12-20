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
