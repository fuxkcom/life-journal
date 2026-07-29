-- ============================================================
-- 隐私修复迁移脚本
-- 用途：修复已上线数据库中 posts/comments/likes 等表的 RLS 策略，
--       使"仅朋友可见/仅自己可见"在数据库层真正生效（此前策略为
--       USING (true)，任何人都能读到所有帖子，无论隐私设置）。
-- 使用方法：在 Supabase Dashboard > SQL Editor 中直接运行本文件即可，
--          无需重跑 supabase-setup.sql，也不会影响现有数据。
-- ============================================================

-- 1. 辅助函数：判断当前用户是否可以查看某篇帖子
CREATE OR REPLACE FUNCTION can_view_post(p_post_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM posts p
    WHERE p.id = p_post_id
      AND (
        p.visibility = 'public'
        OR auth.uid() = p.user_id
        OR (
          p.visibility = 'friends'
          AND EXISTS (
            SELECT 1 FROM friendships f
            WHERE f.status = 'accepted'
              AND (
                (f.user_id = auth.uid() AND f.friend_id = p.user_id)
                OR (f.friend_id = auth.uid() AND f.user_id = p.user_id)
              )
          )
        )
      )
  );
$$;

-- 2. Posts：按 visibility + 好友关系重新定义 SELECT/INSERT
DROP POLICY IF EXISTS "posts_select" ON posts;
CREATE POLICY "posts_select" ON posts FOR SELECT USING (
  auth.role() = 'service_role'
  OR visibility = 'public'
  OR auth.uid() = user_id
  OR (
    visibility = 'friends'
    AND EXISTS (
      SELECT 1 FROM friendships f
      WHERE f.status = 'accepted'
        AND (
          (f.user_id = auth.uid() AND f.friend_id = posts.user_id)
          OR (f.friend_id = auth.uid() AND f.user_id = posts.user_id)
        )
    )
  )
);

DROP POLICY IF EXISTS "posts_insert" ON posts;
CREATE POLICY "posts_insert" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id AND auth.role() = 'authenticated');

-- 3. Comments：只有能看到对应帖子的人才能看到/发表评论
DROP POLICY IF EXISTS "comments_select" ON comments;
CREATE POLICY "comments_select" ON comments FOR SELECT USING (
  auth.role() = 'service_role' OR can_view_post(post_id)
);

DROP POLICY IF EXISTS "comments_insert" ON comments;
CREATE POLICY "comments_insert" ON comments FOR INSERT WITH CHECK (
  auth.uid() = user_id AND auth.role() = 'authenticated' AND can_view_post(post_id)
);

-- 4. Likes：同上
DROP POLICY IF EXISTS "likes_select" ON likes;
CREATE POLICY "likes_select" ON likes FOR SELECT USING (
  auth.role() = 'service_role' OR can_view_post(post_id)
);

DROP POLICY IF EXISTS "likes_insert" ON likes;
CREATE POLICY "likes_insert" ON likes FOR INSERT WITH CHECK (
  auth.uid() = user_id AND auth.role() = 'authenticated' AND can_view_post(post_id)
);

-- 5. 收紧其余表的 INSERT 策略：去掉允许未登录 'anon' 角色写入的漏洞
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "friendships_insert" ON friendships;
CREATE POLICY "friendships_insert" ON friendships FOR INSERT WITH CHECK (auth.uid() = user_id AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "moods_insert" ON moods;
CREATE POLICY "moods_insert" ON moods FOR INSERT WITH CHECK (auth.uid() = user_id AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "messages_insert" ON messages;
CREATE POLICY "messages_insert" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id AND auth.role() = 'authenticated');

-- 完成。建议运行后用一个"仅自己可见"的测试帖子 + 未登录/其他账号请求验证确实读不到。
