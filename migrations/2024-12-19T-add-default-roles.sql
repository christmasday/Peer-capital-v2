-- Add default 'user' role for all existing users who don't have any roles
INSERT INTO user_roles (user_id, role_type, created_by)
SELECT 
  auth.users.id,
  'user',
  auth.users.id
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_roles.user_id = auth.users.id
);

-- Optional: Add admin role to the first user in the system
-- Uncomment the following lines if you want to make the first user an admin
-- INSERT INTO user_roles (user_id, role_type, created_by)
-- SELECT 
--   auth.users.id,
--   'admin',
--   auth.users.id
-- FROM auth.users
-- ORDER BY auth.users.created_at ASC
-- LIMIT 1
-- ON CONFLICT (user_id, role_type) DO NOTHING;
