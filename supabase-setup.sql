-- 生活记录网站数据库设置脚本
-- 请在 Supabase Dashboard > SQL Editor 中运行此脚本

-- 1. 创建表
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  image_urls TEXT[],
  visibility TEXT DEFAULT 'friends',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  friend_id UUID NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS moods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  mood_type TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  post_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- 2. 启用 RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE moods ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- 3. Profiles 策略
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id OR auth.role() IN ('anon', 'service_role'));
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id OR auth.role() = 'service_role');

-- 4. Posts 策略
CREATE POLICY "posts_select" ON posts FOR SELECT USING (true);
CREATE POLICY "posts_insert" ON posts FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role', 'authenticated'));
CREATE POLICY "posts_update" ON posts FOR UPDATE USING (auth.uid() = user_id OR auth.role() = 'service_role');
CREATE POLICY "posts_delete" ON posts FOR DELETE USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- 5. Friendships 策略
CREATE POLICY "friendships_select" ON friendships FOR SELECT USING (auth.uid() IN (user_id, friend_id) OR auth.role() = 'service_role');
CREATE POLICY "friendships_insert" ON friendships FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role', 'authenticated'));
CREATE POLICY "friendships_update" ON friendships FOR UPDATE USING (auth.uid() IN (user_id, friend_id) OR auth.role() = 'service_role');
CREATE POLICY "friendships_delete" ON friendships FOR DELETE USING (auth.uid() IN (user_id, friend_id) OR auth.role() = 'service_role');

-- 6. Comments 策略
CREATE POLICY "comments_select" ON comments FOR SELECT USING (true);
CREATE POLICY "comments_insert" ON comments FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role', 'authenticated'));
CREATE POLICY "comments_delete" ON comments FOR DELETE USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- 7. Messages 策略
CREATE POLICY "messages_select" ON messages FOR SELECT USING (auth.uid() IN (sender_id, receiver_id) OR auth.role() = 'service_role');
CREATE POLICY "messages_insert" ON messages FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role', 'authenticated'));
CREATE POLICY "messages_update" ON messages FOR UPDATE USING (auth.uid() = receiver_id OR auth.role() = 'service_role');

-- 8. Moods 策略
CREATE POLICY "moods_select" ON moods FOR SELECT USING (true);
CREATE POLICY "moods_insert" ON moods FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role', 'authenticated'));
CREATE POLICY "moods_delete" ON moods FOR DELETE USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- 9. Likes 策略
CREATE POLICY "likes_select" ON likes FOR SELECT USING (true);
CREATE POLICY "likes_insert" ON likes FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role', 'authenticated'));
CREATE POLICY "likes_delete" ON likes FOR DELETE USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- 10. 启用实时功能
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;

-- 9. 创建存储桶 (在 Storage 页面手动创建)
-- avatars: 用于用户头像, 允许 image/*, 限制 5MB
-- posts: 用于帖子图片, 允许 image/*, 限制 10MB
