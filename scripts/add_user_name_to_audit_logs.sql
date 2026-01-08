-- Add user_name column to audit_logs table to store readable names
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_name VARCHAR(255);

-- Add comment to explain the column
COMMENT ON COLUMN audit_logs.user_name IS 'Human-readable name of the user who performed the action (for display purposes)';
