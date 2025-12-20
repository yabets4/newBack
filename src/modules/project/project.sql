    -- SQL for projects and project_items tables, and company project number sequence

    -- 1. Add next_project_number to companies if not exists

    -- 1. Add next_project_number to companies if not exists (Postgres syntax)
    DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='next_project_number') THEN
            ALTER TABLE companies ADD COLUMN next_project_number INTEGER DEFAULT 1;
        END IF;
    END $$;

    -- 2. Projects table (expanded)
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

    -- 4. Project team members (array in frontend, relational here)
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

    -- 5. Tool assignments (array in frontend, relational here)
    CREATE TABLE IF NOT EXISTS project_tool_assignments (
        id SERIAL PRIMARY KEY,
        company_id VARCHAR(20) NOT NULL,
        project_id VARCHAR(32) NOT NULL,
        tool_type_id VARCHAR(64) NOT NULL,
        assigned_employee_id VARCHAR(20),
        start_date DATE,
        end_date DATE,
        start_time VARCHAR(16),
        end_time VARCHAR(16),
        FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
        FOREIGN KEY (company_id, project_id) REFERENCES projects(company_id, project_id) ON DELETE CASCADE,
        FOREIGN KEY (company_id, assigned_employee_id) REFERENCES employees(company_id, employee_id) ON DELETE SET NULL
    );

    -- 6. Uploaded files (array in frontend, relational here)
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
