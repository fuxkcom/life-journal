import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // 不再把生产环境的真实值硬编码在源码里当 fallback：
  // 一旦环境变量缺失就应该在构建/启动时立刻报错，而不是静默用一个写死的项目。
  throw new Error(
    '缺少 Supabase 环境变量：请设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY（参考 .env.example）'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Profile = {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  created_at: string
  updated_at: string
}

export type Post = {
  id: string
  user_id: string
  content: string
  image_urls: string[] | null
  visibility: 'friends' | 'public' | 'private'
  created_at: string
  updated_at: string
  latitude: number | null
  longitude: number | null
  location_name: string | null
  show_location: boolean
  profile?: Profile
}

export type Friendship = {
  id: string
  user_id: string
  friend_id: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
}

export type Comment = {
  id: string
  post_id: string
  user_id: string
  content: string
  created_at: string
  profile?: Profile
}

export type Message = {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  read: boolean
  created_at: string
}

export type Mood = {
  id: string
  user_id: string
  mood_type: 'happy' | 'smile' | 'neutral' | 'sad' | 'angry'
  note: string | null
  created_at: string
}

export type Activity = {
  id: string
  user_id: string
  type: 'comment' | 'like' | 'friend_request' | 'system'
  content: string
  related_user_id: string | null
  related_post_id: string | null
  is_read: boolean
  created_at: string
}

export type Like = {
  id: string
  user_id: string
  post_id: string
  created_at: string
}
