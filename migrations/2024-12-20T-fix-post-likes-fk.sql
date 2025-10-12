-- Fix foreign key constraint in post_likes and post_comments tables
-- This migration fixes the issue where these tables reference user_posts instead of posts

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 1: Drop tables if they exist with wrong foreign key
DROP TABLE IF EXISTS post_likes CASCADE;
DROP TABLE IF EXISTS post_comments CASCADE;

-- Step 2: Recreate post_comments table with correct foreign key to posts table
CREATE TABLE post_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  likes_count INTEGER DEFAULT 0
);

-- Step 3: Recreate post_likes table with correct foreign key to posts table
CREATE TABLE post_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT post_or_comment_check CHECK (
    (post_id IS NULL AND comment_id IS NOT NULL) OR
    (post_id IS NOT NULL AND comment_id IS NULL)
  ),
  UNIQUE (user_id, post_id),
  UNIQUE (user_id, comment_id)
);

-- Step 4: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_user_id ON post_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_comment_id ON post_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);

-- Step 5: Enable RLS
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies for post_comments
CREATE POLICY "Users can view comments on posts they can see" ON post_comments
  FOR SELECT USING (
    post_id IN (
      SELECT id FROM posts WHERE user_id IN (
        SELECT following_id FROM user_connections 
        WHERE follower_id = auth.uid() AND status = 'active'
      ) OR user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create comments on posts they can see" ON post_comments
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    post_id IN (
      SELECT id FROM posts WHERE user_id IN (
        SELECT following_id FROM user_connections 
        WHERE follower_id = auth.uid() AND status = 'active'
      ) OR user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own comments" ON post_comments
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own comments" ON post_comments
  FOR DELETE USING (user_id = auth.uid());

-- Step 7: Create RLS policies for post_likes
CREATE POLICY "Users can view likes on posts they can see" ON post_likes
  FOR SELECT USING (
    (post_id IS NOT NULL AND post_id IN (
      SELECT id FROM posts WHERE user_id IN (
        SELECT following_id FROM user_connections 
        WHERE follower_id = auth.uid() AND status = 'active'
      ) OR user_id = auth.uid()
    )) OR
    (comment_id IS NOT NULL AND comment_id IN (
      SELECT id FROM post_comments WHERE post_id IN (
        SELECT id FROM posts WHERE user_id IN (
          SELECT following_id FROM user_connections 
          WHERE follower_id = auth.uid() AND status = 'active'
        ) OR user_id = auth.uid()
      )
    ))
  );

CREATE POLICY "Users can create likes on posts they can see" ON post_likes
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    ((post_id IS NOT NULL AND post_id IN (
      SELECT id FROM posts WHERE user_id IN (
        SELECT following_id FROM user_connections 
        WHERE follower_id = auth.uid() AND status = 'active'
      ) OR user_id = auth.uid()
    )) OR
    (comment_id IS NOT NULL AND comment_id IN (
      SELECT id FROM post_comments WHERE post_id IN (
        SELECT id FROM posts WHERE user_id IN (
          SELECT following_id FROM user_connections 
          WHERE follower_id = auth.uid() AND status = 'active'
        ) OR user_id = auth.uid()
      )
    )))
  );

CREATE POLICY "Users can delete their own likes" ON post_likes
  FOR DELETE USING (user_id = auth.uid());

