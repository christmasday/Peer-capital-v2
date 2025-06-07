ALTER TABLE loan_requests ADD COLUMN IF NOT EXISTS duration_unit text DEFAULT 'months'; ALTER TABLE loan_requests ADD COLUMN IF NOT EXISTS duration integer;
