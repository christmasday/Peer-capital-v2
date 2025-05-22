-- Add referral_code and referred_by columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by TEXT;
 
-- Optionally, you can add a foreign key constraint if you want strict referential integrity:
-- ALTER TABLE profiles ADD CONSTRAINT fk_referred_by FOREIGN KEY (referred_by) REFERENCES profiles(referral_code); 