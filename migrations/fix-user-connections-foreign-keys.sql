-- Drop the existing foreign key constraints
ALTER TABLE IF EXISTS public.user_connections 
  DROP CONSTRAINT IF EXISTS user_connections_follower_id_fkey,
  DROP CONSTRAINT IF EXISTS user_connections_following_id_fkey;

-- Add new foreign key constraints referencing profiles table instead
ALTER TABLE public.user_connections
  ADD CONSTRAINT user_connections_follower_id_fkey 
  FOREIGN KEY (follower_id) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE;

ALTER TABLE public.user_connections
  ADD CONSTRAINT user_connections_following_id_fkey 
  FOREIGN KEY (following_id) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE;
