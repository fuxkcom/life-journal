import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, Post, Profile, Comment, Mood } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { 
  Heart, MessageCircle, MoreHorizontal, Send, Image, 
  PenSquare, Users, MessageSquare, BarChart3, Sparkles,
  TrendingUp, Bell, UserPlus, ChevronRight, Smile, Meh, Frown, 
  Angry, Sun, CloudRain, Wind, Thermometer, Clock, MapPin,
  ZoomIn
} from 'lucide-react'
import Layout from '../components/Layout'
import DateTime from '../components/DateTime'
import Weather from '../components/Weather'

// 每日格言数据
const DAILY_QUOTES = [
  { text: "生活不是等待风暴过去，而是学会在雨中跳舞。", author: "维维安·格林" },
  { text: "每一个不曾起舞的日子，都是对生命的辜负。", author: "尼采" },
  { text: "把每一天当作生命的最后一天来过。", author: "史蒂夫·乔布斯" },
  { text: "生活中最重要的事情是学会如何给予爱，以及接受爱。", author: "莫里·施瓦茨" },
  { text: "幸福不是拥有得多，而是计较得少。", author: "佚名" },
  { text: "今天的努力是明天的礼物。", author: "佚名" },
  { text: "每一次日出都是重新开始的机会。", author: "佚名" },
  { text: "温柔地对待自己，你正在尽力而为。", author: "佚名" },
  { text: "小事成就大事，细节成就完美。", author: "约翰·伍登" },
  { text: "保持微笑，生活会回报你更多的阳光。", author: "佚名" },
]

// 心情配置
const MOOD_CONFIG = {
  happy: { icon: Sparkles, label: '开心', color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200' },
  smile: { icon: Smile, label: '愉快', color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-200' },
  neutral: { icon: Meh, label: '平静', color: 'text-stone-500', bg: 'bg-stone-50', border: 'border-stone-200' },
  sad: { icon: Frown, label: '难过', color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200' },
  angry: { icon: Angry, label: '生气', color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200' },
}

// 帖子图片画廊组件
const PostImageGallery = ({ 
  post, 
  onImageClick 
}: { 
  post: any; 
  onImageClick?: () => void;
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  
  // 将帖子数据转换为图片数组
  const galleryImages = (post.image_urls || []).map((url: string, index: number) => ({
    id: `${post.id}-${index}`,
    url: url,
    thumbnailUrl: url,
    alt: post.content || `来自 ${post.profile?.display_name || post.profile?.username} 的图片`,
    caption: post.content,
    uploader: {
      id: post.user_id,
      name: post.profile?.display_name || post.profile?.username || '好友',
      avatar: post.profile?.avatar_url
    },
    createdAt: post.created_at,
    likes: post.likes_count || 0,
    isLiked: post.is_liked || false
  }));
  
  // 单个帖子的缩略图显示
  const renderThumbnails = () => {
    const imageCount = galleryImages.length;
    
    if (imageCount === 0) return null;
    
    // 1张图片：中等大小
    if (imageCount === 1) {
      return (
        <div className="max-w-2xl">
          <div 
            className="relative overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800 cursor-pointer group"
            onClick={() => {
              setSelectedImageIndex(0);
              onImageClick?.();
            }}
          >
            <img
              src={galleryImages[0].url}
              alt={galleryImages[0].alt || ''}
              className="w-full h-auto max-h-[400px] object-contain transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
              <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          </div>
        </div>
      );
    }
    
    // 2-4张图片：网格布局
    if (imageCount <= 4) {
      const gridCols = imageCount === 2 ? 'grid-cols-2' : 'grid-cols-2';
      const maxWidth = imageCount <= 2 ? 'max-w-xl' : 'max-w-2xl';
      
      return (
        <div className={`${maxWidth}`}>
          <div className={`grid ${gridCols} gap-2`}>
            {galleryImages.slice(0, 4).map((image, index) => (
              <div
                key={image.id}
                className="relative aspect-square overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800 cursor-pointer group"
                onClick={() => {
                  setSelectedImageIndex(index);
                  onImageClick?.();
                }}
              >
                <img
                  src={image.url}
                  alt={image.alt || ''}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                  <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  {imageCount > 4 && index === 3 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        +{imageCount - 3}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    // 5张以上图片：3x3网格，最后一张显示剩余数量
    return (
      <div className="max-w-2xl">
        <div className="grid grid-cols-3 gap-2">
          {galleryImages.slice(0, 9).map((image, index) => (
            <div
              key={image.id}
              className={`relative overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800 cursor-pointer group ${
                index < 6 ? 'aspect-square' : 'aspect-video'
              }`}
              onClick={() => {
                setSelectedImageIndex(index);
                onImageClick?.();
              }}
            >
              <img
                src={image.url}
                alt={image.alt || ''}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              
              {index === 8 && galleryImages.length > 9 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    +{galleryImages.length - 9}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  return (
    <>
      {renderThumbnails()}
      
      {/* 全屏图片浏览 */}
      {selectedImageIndex !== null && (
        <div className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-2 md:p-4">
          <div 
            className="absolute inset-0"
            onClick={() => setSelectedImageIndex(null)}
          />
          
          <div className="relative z-10 w-full max-w-6xl max-h-[90vh]">
            <button
              onClick={() => setSelectedImageIndex(null)}
              className="absolute -top-12 right-0 p-3 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors z-20"
              aria-label="关闭"
            >
              ✕
            </button>
            
            <div className="relative w-full h-full">
              {/* 当前图片 */}
              <div className="flex items-center justify-center h-full">
                <img
                  src={galleryImages[selectedImageIndex].url}
                  alt={galleryImages[selectedImageIndex].alt || ''}
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              </div>
              
              {/* 导航箭头 */}
              {galleryImages.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImageIndex(
                        selectedImageIndex > 0 
                          ? selectedImageIndex - 1 
                          : galleryImages.length - 1
                      );
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-white hover:bg-white/20 rounded-full transition-colors backdrop-blur-sm"
                  >
                    ←
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImageIndex(
                        selectedImageIndex < galleryImages.length - 1 
                          ? selectedImageIndex + 1 
                          : 0
                      );
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-white hover:bg-white/20 rounded-full transition-colors backdrop-blur-sm"
                  >
                    →
                  </button>
                </>
              )}
              
              {/* 图片信息 */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                <div className="flex items-center justify-between">
                  <div className="text-white">
                    <p className="font-medium">
                      {galleryImages[selectedImageIndex].uploader?.name}
                    </p>
                    {galleryImages[selectedImageIndex].caption && (
                      <p className="text-sm opacity-90 mt-1">
                        {galleryImages[selectedImageIndex].caption}
                      </p>
                    )}
                  </div>
                  <div className="text-white text-sm">
                    {selectedImageIndex + 1} / {galleryImages.length}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default function Home() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [posts, setPosts] = useState<(Post & { profile: Profile; comments: (Comment & { profile: Profile })[]; likes_count: number; is_liked: boolean })[]>([])
  const [loading, setLoading] = useState(true)
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({})
  const [showComments, setShowComments] = useState<Record<string, boolean>>({})
  
  // 新功能状态
  const [stats, setStats] = useState({ weekPosts: 0, friends: 0, comments: 0, totalPosts: 0 })
  const [moods, setMoods] = useState<Mood[]>([])
  const [todayMood, setTodayMood] = useState<Mood | null>(null)
  const [moodNote, setMoodNote] = useState('')
  const [showMoodInput, setShowMoodInput] = useState(false)
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [quickPostContent, setQuickPostContent] = useState('')
  const [quickPosting, setQuickPosting] = useState(false)
  const [activities, setActivities] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [friendMoods, setFriendMoods] = useState<(Mood & { profile: Profile })[]>([])
  const [activeMenuPostId, setActiveMenuPostId] = useState<string | null>(null)

  // 获取每日格言
  const dailyQuote = useMemo(() => {
    const today = new Date()
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000)
    return DAILY_QUOTES[dayOfYear % DAILY_QUOTES.length]
  }, [])

  useEffect(() => {
    if (user) {
      loadAllData()
    }
  }, [user])

  const loadAllData = async () => {
    setLoading(true)
    await Promise.all([
      loadPosts(),
      loadStats(),
      loadMoods(),
      loadActivities(),
      loadFriendMoods()
    ])
    setLoading(false)
  }

  const loadStats = async () => {
    if (!user) return

    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const [weekPostsRes, friendsRes, commentsRes, totalPostsRes] = await Promise.all([
      supabase.from('posts').select('id', { count: 'exact' }).eq('user_id', user.id).gte('created_at', weekAgo.toISOString()),
      supabase.from('friendships').select('id', { count: 'exact' }).or(`user_id.eq.${user.id},friend_id.eq.${user.id}`).eq('status', 'accepted'),
      supabase.from('comments').select('id', { count: 'exact' }).eq('user_id', user.id),
      supabase.from('posts').select('id', { count: 'exact' }).eq('user_id', user.id)
    ])

    setStats({
      weekPosts: weekPostsRes.count || 0,
      friends: friendsRes.count || 0,
      comments: commentsRes.count || 0,
      totalPosts: totalPostsRes.count || 0
    })
  }

  const loadMoods = async () => {
    if (!user) return

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data } = await supabase
      .from('moods')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30)

    if (data) {
      setMoods(data)
      const todaysMood = data.find(m => new Date(m.created_at) >= today)
      setTodayMood(todaysMood || null)
    }
  }

  const loadFriendMoods = async () => {
    if (!user) return

    const { data: friendships } = await supabase
      .from('friendships')
      .select('*')
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
      .eq('status', 'accepted')

    const friendIds = friendships?.map(f => f.user_id === user.id ? f.friend_id : f.user_id) || []
    
    if (friendIds.length === 0) return

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data: moodsData } = await supabase
      .from('moods')
      .select('*')
      .in('user_id', friendIds)
      .gte('created_at', today.toISOString())
      .order('created_at', { ascending: false })

    if (moodsData && moodsData.length > 0) {
      const userIds = [...new Set(moodsData.map(m => m.user_id))]
      const { data: profiles } = await supabase.from('profiles').select('*').in('id', userIds)
      
      const moodsWithProfiles = moodsData.map(mood => ({
        ...mood,
        profile: profiles?.find(p => p.id === mood.user_id) as Profile
      }))
      setFriendMoods(moodsWithProfiles)
    }
  }

  const loadActivities = async () => {
    if (!user) return

    // 获取最近评论(别人对我帖子的评论)
    const { data: myPosts } = await supabase
      .from('posts')
      .select('id')
      .eq('user_id', user.id)

    const postIds = myPosts?.map(p => p.id) || []

    if (postIds.length > 0) {
      const { data: recentComments } = await supabase
        .from('comments')
        .select('*, profile:profiles(*)')
        .in('post_id', postIds)
        .neq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      const activitiesData = recentComments?.map(c => ({
        id: c.id,
        type: 'comment',
        content: `${c.profile?.display_name || c.profile?.username} 评论了你的动态`,
        created_at: c.created_at,
        profile: c.profile
      })) || []

      setActivities(activitiesData)
    }

    // 获取未读好友请求数
    const { count } = await supabase
      .from('friendships')
      .select('*', { count: 'exact' })
      .eq('friend_id', user.id)
      .eq('status', 'pending')

    setUnreadCount(count || 0)
  }

  const loadPosts = async () => {
    if (!user) return
    
    const { data: friendships } = await supabase
      .from('friendships')
      .select('*')
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
      .eq('status', 'accepted')

    const friendIds = friendships?.map(f => f.user_id === user.id ? f.friend_id : f.user_id) || []
    friendIds.push(user.id)

    const { data: postsData } = await supabase
      .from('posts')
      .select('*')
      .in('user_id', friendIds)
      .order('created_at', { ascending: false })
      .limit(10)

    if (postsData && postsData.length > 0) {
      const userIds = [...new Set(postsData.map(p => p.user_id))]
      const { data: profiles } = await supabase.from('profiles').select('*').in('id', userIds)
      
      const postIds = postsData.map(p => p.id)
      const { data: comments } = await supabase
        .from('comments')
        .select('*')
        .in('post_id', postIds)
        .order('created_at', { ascending: true })

      const { data: likes } = await supabase
        .from('likes')
        .select('*')
        .in('post_id', postIds)

      const commentUserIds = [...new Set(comments?.map(c => c.user_id) || [])]
      const { data: commentProfiles } = await supabase.from('profiles').select('*').in('id', commentUserIds.length > 0 ? commentUserIds : ['00000000-0000-0000-0000-000000000000'])

      const postsWithData = postsData.map(post => ({
        ...post,
        profile: profiles?.find(p => p.id === post.user_id) as Profile,
        comments: (comments?.filter(c => c.post_id === post.id) || []).map(c => ({
          ...c,
          profile: commentProfiles?.find(p => p.id === c.user_id) as Profile
        })),
        likes_count: likes?.filter(l => l.post_id === post.id).length || 0,
        is_liked: likes?.some(l => l.post_id === post.id && l.user_id === user.id) || false
      }))
      setPosts(postsWithData)
    } else {
      setPosts([])
    }
  }

  const saveMood = async () => {
    if (!user || !selectedMood) return

    const { error } = await supabase.from('moods').insert({
      user_id: user.id,
      mood_type: selectedMood,
      note: moodNote || null
    })

    if (!error) {
      setShowMoodInput(false)
      setSelectedMood(null)
      setMoodNote('')
      loadMoods()
    }
  }

  const handleQuickPost = async () => {
    if (!quickPostContent.trim() || !user || quickPosting) return

    setQuickPosting(true)
    const { error } = await supabase.from('posts').insert({
      user_id: user.id,
      content: quickPostContent.trim(),
      visibility: 'friends'
    })

    if (!error) {
      setQuickPostContent('')
      loadPosts()
      loadStats()
    }
    setQuickPosting(false)
  }

  const toggleLike = async (postId: string, isLiked: boolean) => {
    if (!user) return

    if (isLiked) {
      await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', user.id)
    } else {
      await supabase.from('likes').insert({ post_id: postId, user_id: user.id })
    }
    loadPosts()
  }

  const addComment = async (postId: string) => {
    const content = commentInputs[postId]?.trim()
    if (!content || !user) return

    await supabase.from('comments').insert({
      post_id: postId,
      user_id: user.id,
      content
    })

    setCommentInputs({ ...commentInputs, [postId]: '' })
    loadPosts()
  }

  const deletePost = async (postId: string) => {
    if (!user) return
    const { error } = await supabase.from('posts').delete().eq('id', postId).eq('user_id', user.id)
    if (!error) {
      setActiveMenuPostId(null)
      loadPosts()
      loadStats()
    }
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 7) return `${days}天前`
    return date.toLocaleDateString('zh-CN')
  }

  // 心情趋势计算
  const moodTrend = useMemo(() => {
    const last7Days = moods.slice(0, 7)
    const moodScores: Record<string, number> = { happy: 5, smile: 4, neutral: 3, sad: 2, angry: 1 }
    if (last7Days.length === 0) return null
    const avg = last7Days.reduce((sum, m) => sum + moodScores[m.mood_type], 0) / last7Days.length
    return avg
  }, [moods])

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-terracotta-500"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-4 pb-24 md:pb-4">
        {/* 顶部：日期天气 + 每日格言 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-3xl shadow-soft p-5">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <DateTime />
              <Weather />
            </div>
          </div>
          
          {/* 每日格言 */}
          <div className="bg-gradient-to-br from-terracotta-50 to-cream rounded-3xl shadow-soft p-5 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-terracotta-500" />
              <span className="text-xs font-medium text-terracotta-600">每日格言</span>
            </div>
            <p className="text-stone-700 text-sm leading-relaxed italic">"{dailyQuote.text}"</p>
            <p className="text-stone-400 text-xs mt-2 text-right">—— {dailyQuote.author}</p>
          </div>
        </div>

        {/* 心情记录 + 统计仪表板 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* 心情记录卡片 */}
          <div className="lg:col-span-1 bg-white rounded-3xl shadow-soft p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-stone-900">今日心情</h3>
              {moodTrend && (
                <div className="flex items-center gap-1 text-xs text-stone-500">
                  <TrendingUp className="w-3 h-3" />
                  <span>近7天均值: {moodTrend.toFixed(1)}</span>
                </div>
              )}
            </div>
            
            {todayMood ? (
              <div className={`p-4 rounded-2xl ${MOOD_CONFIG[todayMood.mood_type].bg} border ${MOOD_CONFIG[todayMood.mood_type].border}`}>
                <div className="flex items-center gap-3">
                  {(() => {
                    const MoodIcon = MOOD_CONFIG[todayMood.mood_type].icon
                    return <MoodIcon className={`w-8 h-8 ${MOOD_CONFIG[todayMood.mood_type].color}`} />
                  })()}
                  <div>
                    <p className={`font-medium ${MOOD_CONFIG[todayMood.mood_type].color}`}>
                      {MOOD_CONFIG[todayMood.mood_type].label}
                    </p>
                    {todayMood.note && (
                      <p className="text-sm text-stone-500 mt-1">{todayMood.note}</p>
                    )}
                  </div>
                </div>
              </div>
            ) : showMoodInput ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  {Object.entries(MOOD_CONFIG).map(([key, config]) => {
                    const MoodIcon = config.icon
                    return (
                      <button
                        key={key}
                        onClick={() => setSelectedMood(key)}
                        className={`p-3 rounded-xl transition-all duration-300 ${
                          selectedMood === key 
                            ? `${config.bg} ${config.border} border-2` 
                            : 'hover:bg-stone-50'
                        }`}
                      >
                        <MoodIcon className={`w-6 h-6 ${selectedMood === key ? config.color : 'text-stone-400'}`} />
                      </button>
                    )
                  })}
                </div>
                <input
                  type="text"
                  value={moodNote}
                  onChange={(e) => setMoodNote(e.target.value)}
                  placeholder="记录此刻的心情..."
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-500/20"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowMoodInput(false); setSelectedMood(null); setMoodNote('') }}
                    className="flex-1 px-4 py-2 text-sm text-stone-500 hover:bg-stone-100 rounded-xl transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={saveMood}
                    disabled={!selectedMood}
                    className="flex-1 px-4 py-2 text-sm bg-terracotta-500 text-white rounded-xl hover:bg-terracotta-600 transition-colors disabled:opacity-50"
                  >
                    保存
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowMoodInput(true)}
                className="w-full p-4 border-2 border-dashed border-stone-200 rounded-2xl hover:border-terracotta-300 hover:bg-terracotta-50/50 transition-all duration-300 text-stone-400 hover:text-terracotta-500"
              >
                点击记录今日心情
              </button>
            )}

            {/* 最近心情历史 */}
            {moods.length > 0 && !showMoodInput && (
              <div className="mt-4 pt-4 border-t border-stone-100">
                <p className="text-xs text-stone-400 mb-2">最近记录</p>
                <div className="flex gap-1">
                  {moods.slice(0, 7).map((mood, i) => {
                    const MoodIcon = MOOD_CONFIG[mood.mood_type].icon
                    return (
                      <div key={mood.id} className="flex-1 flex justify-center">
                        <MoodIcon className={`w-4 h-4 ${MOOD_CONFIG[mood.mood_type].color}`} />
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 统计仪表板 */}
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-soft p-5">
            <h3 className="font-semibold text-stone-900 mb-4">我的数据</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-terracotta-50 to-terracotta-100/50 rounded-2xl p-4 text-center">
                <BarChart3 className="w-6 h-6 text-terracotta-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-terracotta-600">{stats.weekPosts}</p>
                <p className="text-xs text-stone-500">本周发布</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-2xl p-4 text-center">
                <Users className="w-6 h-6 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-600">{stats.friends}</p>
                <p className="text-xs text-stone-500">好友数</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-4 text-center">
                <MessageSquare className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-600">{stats.comments}</p>
                <p className="text-xs text-stone-500">发出评论</p>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-2xl p-4 text-center">
                <PenSquare className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-amber-600">{stats.totalPosts}</p>
                <p className="text-xs text-stone-500">累计记录</p>
              </div>
            </div>
          </div>
        </div>

        {/* 快速发布 + 快捷操作 + 最近活动 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* 快速发布 */}
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-soft p-5">
            <h3 className="font-semibold text-stone-900 mb-4">快速发布</h3>
            <div className="flex gap-3">
              <textarea
                value={quickPostContent}
                onChange={(e) => setQuickPostContent(e.target.value)}
                placeholder="分享你的生活点滴..."
                className="flex-1 px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 resize-none h-20"
              />
              <button
                onClick={handleQuickPost}
                disabled={!quickPostContent.trim() || quickPosting}
                className="self-end px-6 py-3 bg-terracotta-500 text-white rounded-2xl hover:bg-terracotta-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">发布</span>
              </button>
            </div>
          </div>

          {/* 快捷操作 */}
          <div className="bg-white rounded-3xl shadow-soft p-5">
            <h3 className="font-semibold text-stone-900 mb-4">快捷操作</h3>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => navigate('/new-post')}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-terracotta-50 transition-colors group"
              >
                <div className="w-10 h-10 bg-terracotta-100 rounded-xl flex items-center justify-center group-hover:bg-terracotta-200 transition-colors">
                  <PenSquare className="w-5 h-5 text-terracotta-600" />
                </div>
                <span className="text-xs text-stone-600">发布记录</span>
              </button>
              <button 
                onClick={() => navigate('/friends')}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-green-50 transition-colors group relative"
              >
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <UserPlus className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-xs text-stone-600">添加好友</span>
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
              <button 
                onClick={() => navigate('/chat')}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-blue-50 transition-colors group"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <MessageCircle className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-xs text-stone-600">聊天</span>
              </button>
              <button 
                onClick={() => navigate('/profile')}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-amber-50 transition-colors group"
              >
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                  <Users className="w-5 h-5 text-amber-600" />
                </div>
                <span className="text-xs text-stone-600">我的主页</span>
              </button>
            </div>
          </div>
        </div>

        {/* 好友心情状态 + 最近活动 */}
        {(friendMoods.length > 0 || activities.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* 好友今日心情 */}
            {friendMoods.length > 0 && (
              <div className="bg-white rounded-3xl shadow-soft p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-stone-900">好友今日心情</h3>
                </div>
                <div className="space-y-3">
                  {friendMoods.slice(0, 5).map((mood) => {
                    const MoodIcon = MOOD_CONFIG[mood.mood_type].icon
                    return (
                      <div key={mood.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-stone-50 transition-colors">
                        <div className="w-9 h-9 rounded-xl bg-terracotta-100 flex items-center justify-center overflow-hidden">
                          {mood.profile?.avatar_url ? (
                            <img src={mood.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-terracotta-600 text-sm font-medium">
                              {mood.profile?.display_name?.[0] || mood.profile?.username?.[0]}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-stone-800">{mood.profile?.display_name || mood.profile?.username}</p>
                          {mood.note && <p className="text-xs text-stone-400 truncate">{mood.note}</p>}
                        </div>
                        <MoodIcon className={`w-5 h-5 ${MOOD_CONFIG[mood.mood_type].color}`} />
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* 最近活动 */}
            {activities.length > 0 && (
              <div className="bg-white rounded-3xl shadow-soft p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-stone-900">最近活动</h3>
                  <Bell className="w-4 h-4 text-stone-400" />
                </div>
                <div className="space-y-3">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-stone-50 transition-colors">
                      <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
                        <MessageCircle className="w-4 h-4 text-blue-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-stone-700">{activity.content}</p>
                        <p className="text-xs text-stone-400">{formatTime(activity.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 好友动态列表 */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-stone-900">好友动态</h2>
          <button 
            onClick={() => loadPosts()}
            className="text-sm text-terracotta-500 hover:text-terracotta-600 transition-colors"
          >
            刷新
          </button>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl shadow-soft">
            <div className="w-16 h-16 bg-terracotta-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <Image className="w-8 h-8 text-terracotta-500" />
            </div>
            <p className="text-stone-500 text-lg">还没有动态</p>
            <p className="text-stone-400 mt-1">发布你的第一条生活记录吧</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post.id} className="bg-white rounded-3xl shadow-soft overflow-hidden transition-all duration-300 hover:shadow-soft-lg">
                {/* Post Header */}
                <div className="p-4 flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-terracotta-100 flex items-center justify-center overflow-hidden">
                    {post.profile?.avatar_url ? (
                      <img src={post.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-terracotta-600 font-medium">
                        {post.profile?.display_name?.[0] || post.profile?.username?.[0]}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-stone-900">{post.profile?.display_name || post.profile?.username}</p>
                    <div className="flex items-center gap-3 text-xs text-stone-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(post.created_at)}
                      </span>
                      {post.show_location && post.location_name && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {post.location_name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="relative">
                    <button 
                      onClick={() => setActiveMenuPostId(activeMenuPostId === post.id ? null : post.id)}
                      className="p-2 hover:bg-stone-100 rounded-xl transition-colors duration-300"
                    >
                      <MoreHorizontal className="w-5 h-5 text-stone-400" />
                    </button>
                    {activeMenuPostId === post.id && (
                      <div className="absolute right-0 top-10 bg-white rounded-xl shadow-lg border border-stone-100 py-1 z-10 min-w-[120px]">
                        {post.user_id === user?.id && (
                          <button
                            onClick={() => deletePost(post.id)}
                            className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-red-50 transition-colors"
                          >
                            删除
                          </button>
                        )}
                        <button
                          onClick={() => setActiveMenuPostId(null)}
                          className="w-full px-4 py-2 text-left text-sm text-stone-600 hover:bg-stone-50 transition-colors"
                        >
                          取消
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Post Content */}
                <div className="px-4 pb-4">
                  <p className="text-stone-700 whitespace-pre-wrap leading-relaxed">{post.content}</p>
                </div>

                {/* Post Images - 使用增强版画廊 */}
                {post.image_urls && post.image_urls.length > 0 && (
                  <div className="px-4 pb-4">
                    <PostImageGallery 
                      post={post}
                      onImageClick={() => {
                        console.log('点击了帖子图片:', post.id);
                      }}
                    />
                  </div>
                )}

                {/* Actions */}
                <div className="p-4 flex items-center gap-6 border-t border-stone-100">
                  <button 
                    onClick={() => toggleLike(post.id, post.is_liked)}
                    className={`flex items-center gap-2 transition-colors duration-300 ${
                      post.is_liked ? 'text-red-500' : 'text-stone-400 hover:text-red-500'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${post.is_liked ? 'fill-current' : ''}`} />
                    <span className="text-sm">{post.likes_count || '喜欢'}</span>
                  </button>
                  <button 
                    onClick={() => setShowComments({ ...showComments, [post.id]: !showComments[post.id] })}
                    className="flex items-center gap-2 text-stone-400 hover:text-terracotta-500 transition-colors duration-300"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-sm">{post.comments.length || '评论'}</span>
                  </button>
                </div>

                {/* Comments Section */}
                {showComments[post.id] && (
                  <div className="border-t border-stone-100">
                    {post.comments.length > 0 && (
                      <div className="p-4 space-y-3">
                        {post.comments.map((comment) => (
                          <div key={comment.id} className="flex gap-3">
                            <div className="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center shrink-0 overflow-hidden">
                              {comment.profile?.avatar_url ? (
                                <img src={comment.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-xs text-stone-600">{comment.profile?.display_name?.[0]}</span>
                              )}
                            </div>
                            <div className="flex-1 bg-stone-50 rounded-2xl p-3">
                              <p className="text-sm font-medium text-stone-900">{comment.profile?.display_name}</p>
                              <p className="text-sm text-stone-600">{comment.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Comment Input */}
                    <div className="p-4 border-t border-stone-100 flex gap-3">
                      <input
                        type="text"
                        value={commentInputs[post.id] || ''}
                        onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                        placeholder="写评论..."
                        className="flex-1 px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-400 transition-all duration-300"
                        onKeyPress={(e) => e.key === 'Enter' && addComment(post.id)}
                      />
                      <button
                        onClick={() => addComment(post.id)}
                        className="p-2.5 text-terracotta-600 hover:bg-terracotta-50 rounded-xl transition-colors duration-300"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
