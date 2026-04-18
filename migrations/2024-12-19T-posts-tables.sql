-- Create posts table if it doesn't exist
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  image_sizes JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0
);

-- Create comments table if it doesn't exist
CREATE TABLE IF NOT EXISTS post_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  likes_count INTEGER DEFAULT 0
);

-- Create likes table if it doesn't exist
CREATE TABLE IF NOT EXISTS post_likes (
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_comment_id ON post_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);

-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for posts
CREATE POLICY "Users can view posts from people they follow or their own posts" ON posts
  FOR SELECT USING (
    user_id IN (
      SELECT following_id FROM user_connections 
      WHERE follower_id = auth.uid()::text AND status = 'active'
    ) OR user_id = auth.uid()::text
  );

CREATE POLICY "Users can create their own posts" ON posts
  FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update their own posts" ON posts
  FOR UPDATE USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete their own posts" ON posts
  FOR DELETE USING (user_id = auth.uid()::text);

-- RLS Policies for post_comments
CREATE POLICY "Users can view comments on posts they can see" ON post_comments
  FOR SELECT USING (
    post_id IN (
      SELECT id FROM posts WHERE user_id IN (
        SELECT following_id FROM user_connections 
        WHERE follower_id = auth.uid()::text AND status = 'active'
      ) OR user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can create comments on posts they can see" ON post_comments
  FOR INSERT WITH CHECK (
    user_id = auth.uid()::text AND
    post_id IN (
      SELECT id FROM posts WHERE user_id IN (
        SELECT following_id FROM user_connections 
        WHERE follower_id = auth.uid()::text AND status = 'active'
      ) OR user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can update their own comments" ON post_comments
  FOR UPDATE USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete their own comments" ON post_comments
  FOR DELETE USING (user_id = auth.uid()::text);

-- RLS Policies for post_likes
CREATE POLICY "Users can view likes on posts they can see" ON post_likes
  FOR SELECT USING (
    (post_id IS NOT NULL AND post_id IN (
      SELECT id FROM posts WHERE user_id IN (
        SELECT following_id FROM user_connections 
        WHERE follower_id = auth.uid()::text AND status = 'active'
      ) OR user_id = auth.uid()::text
    )) OR
    (comment_id IS NOT NULL AND comment_id IN (
      SELECT id FROM post_comments WHERE post_id IN (
        SELECT id FROM posts WHERE user_id IN (
          SELECT following_id FROM user_connections 
          WHERE follower_id = auth.uid()::text AND status = 'active'
        ) OR user_id = auth.uid()::text
      )
    ))
  );

CREATE POLICY "Users can create likes on posts they can see" ON post_likes
  FOR INSERT WITH CHECK (
    user_id = auth.uid()::text AND
    ((post_id IS NOT NULL AND post_id IN (
      SELECT id FROM posts WHERE user_id IN (
        SELECT following_id FROM user_connections 
        WHERE follower_id = auth.uid()::text AND status = 'active'
      ) OR user_id = auth.uid()::text
    )) OR
    (comment_id IS NOT NULL AND comment_id IN (
      SELECT id FROM post_comments WHERE post_id IN (
        SELECT id FROM posts WHERE user_id IN (
          SELECT following_id FROM user_connections 
          WHERE follower_id = auth.uid()::text AND status = 'active'
        ) OR user_id = auth.uid()::text
      )
    )))
  );

CREATE POLICY "Users can delete their own likes" ON post_likes
  FOR DELETE USING (user_id = auth.uid()::text);
