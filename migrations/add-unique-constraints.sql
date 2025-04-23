-- Add unique constraints to profiles table for phone_number and bvn
ALTER TABLE profiles ADD CONSTRAINT unique_phone_number UNIQUE (phone_number);
ALTER TABLE profiles ADD CONSTRAINT unique_bvn UNIQUE (bvn);

-- Note: Email uniqueness is already enforced by Supabase Auth at the auth.users level
