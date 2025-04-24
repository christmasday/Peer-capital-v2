-- This migration will explicitly execute the column additions
-- It's designed to be idempotent (safe to run multiple times)

-- Add ID verification fields to profiles table
DO $$
BEGIN
    -- Check if id_type column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'profiles' AND column_name = 'id_type') THEN
        ALTER TABLE profiles ADD COLUMN id_type VARCHAR(50);
    END IF;
    
    -- Check if id_number column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'profiles' AND column_name = 'id_number') THEN
        ALTER TABLE profiles ADD COLUMN id_number VARCHAR(100);
    END IF;
    
    -- Check if id_document_url column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'profiles' AND column_name = 'id_document_url') THEN
        ALTER TABLE profiles ADD COLUMN id_document_url VARCHAR(255);
    END IF;
    
    -- Check if id_verified column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'profiles' AND column_name = 'id_verified') THEN
        ALTER TABLE profiles ADD COLUMN id_verified BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Check if id_verification_date column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'profiles' AND column_name = 'id_verification_date') THEN
        ALTER TABLE profiles ADD COLUMN id_verification_date TIMESTAMPTZ;
    END IF;
    
    -- Check if employment_status column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'profiles' AND column_name = 'employment_status') THEN
        ALTER TABLE profiles ADD COLUMN employment_status VARCHAR(50);
    END IF;
    
    -- Check if employer_name column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'profiles' AND column_name = 'employer_name') THEN
        ALTER TABLE profiles ADD COLUMN employer_name VARCHAR(255);
    END IF;
    
    -- Check if employer_address column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'profiles' AND column_name = 'employer_address') THEN
        ALTER TABLE profiles ADD COLUMN employer_address TEXT;
    END IF;
    
    -- Check if work_phone column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'profiles' AND column_name = 'work_phone') THEN
        ALTER TABLE profiles ADD COLUMN work_phone VARCHAR(20);
    END IF;
    
    -- Check if job_title column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'profiles' AND column_name = 'job_title') THEN
        ALTER TABLE profiles ADD COLUMN job_title VARCHAR(100);
    END IF;
    
    -- Check if monthly_income column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'profiles' AND column_name = 'monthly_income') THEN
        ALTER TABLE profiles ADD COLUMN monthly_income NUMERIC(15, 2);
    END IF;
    
    -- Check if employment_start_date column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'profiles' AND column_name = 'employment_start_date') THEN
        ALTER TABLE profiles ADD COLUMN employment_start_date DATE;
    END IF;
    
    -- Check if employment_end_date column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'profiles' AND column_name = 'employment_end_date') THEN
        ALTER TABLE profiles ADD COLUMN employment_end_date DATE;
    END IF;
    
    -- Check if employment_verified column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'profiles' AND column_name = 'employment_verified') THEN
        ALTER TABLE profiles ADD COLUMN employment_verified BOOLEAN DEFAULT FALSE;
    END IF;
END $$;
