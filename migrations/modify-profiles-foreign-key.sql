-- Start a transaction to ensure all operations succeed or fail together
BEGIN;

-- Step 1: Drop the existing foreign key constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Step 2: Add the new foreign key constraint referencing auth_users table
-- with CASCADE on delete to automatically delete profiles when users are deleted
ALTER TABLE profiles 
  ADD CONSTRAINT profiles_id_fkey 
  FOREIGN KEY (id) 
  REFERENCES auth_users(id) 
  ON DELETE CASCADE;

-- Commit the transaction if everything succeeded
COMMIT;
