-- Add social media columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS facebook_url TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS twitter_url TEXT,
ADD COLUMN IF NOT EXISTS website TEXT;

-- Update the database.types.ts file to include these new columns
