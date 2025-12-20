`ALTER TABLE users
ADD COLUMN is_system_admin BOOLEAN DEFAULT FALSE;


-- Insert super admin
INSERT INTO users (company_id, user_id)
VALUES ('GLOBAL', 'super-001');

INSERT INTO user_profiles (user_pk, name, email, phone, password, role, is_super_admin)
VALUES (
    'GLOBAL',
    'The Ultimate Admin',
    'superadmin@example.com',
    '+0000000000',
    'adminpass',
    'owner',  -- can keep owner role
    TRUE
);
`