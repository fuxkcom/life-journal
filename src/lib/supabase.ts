import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vagfxzyvgfkcdpeysjfi.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhZ2Z4enl2Z2ZrY2RwZXlzamZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NTg5NzYsImV4cCI6MjA4NTEzNDk3Nn0.m8bykEAWoylqHsGGEoBJaY_0sNXaw-I-4bMQzWvhJOc'
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
