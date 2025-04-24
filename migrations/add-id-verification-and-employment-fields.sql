-- Add ID verification fields to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS id_type VARCHAR(50);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS id_number VARCHAR(100);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS id_document_url VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS id_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS id_verification_date TIMESTAMPTZ;

-- Add employment information fields to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS employment_status VARCHAR(50);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS employer_name VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS employer_address TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS work_phone VARCHAR(20);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS job_title VARCHAR(100);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS monthly_income NUMERIC(15, 2);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS employment_start_date DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS employment_end_date DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS employment_verified BOOLEAN DEFAULT FALSE;
