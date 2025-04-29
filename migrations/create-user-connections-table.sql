-- Create user_connections table
CREATE TABLE IF NOT EXISTS public.user_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'pending')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- Add RLS policies
ALTER TABLE public.user_connections ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see their own connections
CREATE POLICY "Users can see their own connections"
  ON public.user_connections
  FOR SELECT
  USING (
    auth.uid() = follower_id OR 
    auth.uid() = following_id
  );

-- Policy to allow users to create their own connections
CREATE POLICY "Users can create their own connections"
  ON public.user_connections
  FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

-- Policy to allow users to update their own connections
CREATE POLICY "Users can update their own connections"
  ON public.user_connections
  FOR UPDATE
  USING (auth.uid() = follower_id);

-- Policy to allow users to delete their own connections
CREATE POLICY "Users can delete their own connections"
  ON public.user_connections
  FOR DELETE
  USING (auth.uid() = follower_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS user_connections_follower_id_idx ON public.user_connections(follower_id);
CREATE INDEX IF NOT EXISTS user_connections_following_id_idx ON public.user_connections(following_id);
CREATE INDEX IF NOT EXISTS user_connections_status_idx ON public.user_connections(status);
