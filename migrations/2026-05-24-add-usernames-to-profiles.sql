-- Add username support to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS username TEXT;

-- Enforce case-insensitive uniqueness for usernames while allowing NULLs
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique_idx
ON profiles (lower(username))
WHERE username IS NOT NULL;
