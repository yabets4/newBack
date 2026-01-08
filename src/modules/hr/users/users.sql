CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    company_id VARCHAR(20) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    user_id VARCHAR(20) NOT NULL,  -- USR-XX
    is_system_admin BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
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