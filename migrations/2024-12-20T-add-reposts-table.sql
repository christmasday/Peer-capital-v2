-- Create reposts table to track user reposts
CREATE TABLE IF NOT EXISTS reposts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, post_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reposts_post_id ON reposts(post_id);
CREATE INDEX IF NOT EXISTS idx_reposts_user_id ON reposts(user_id);

-- Enable RLS
ALTER TABLE reposts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reposts
CREATE POLICY "Users can view reposts on posts they can see" ON reposts
  FOR SELECT USING (
    post_id IN (
      SELECT id FROM posts WHERE user_id IN (
        SELECT following_id FROM user_connections 
        WHERE follower_id = auth.uid() AND status = 'active'
      ) OR user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create reposts on posts they can see" ON reposts
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    post_id IN (
      SELECT id FROM posts WHERE user_id IN (
        SELECT following_id FROM user_connections 
        WHERE follower_id = auth.uid() AND status = 'active'
      ) OR user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own reposts" ON reposts
  FOR DELETE USING (user_id = auth.uid());

