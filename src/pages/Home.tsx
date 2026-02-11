import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, Post, Profile, Comment, Mood } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { 
  Heart, MessageCircle, MoreHorizontal, Send, Image, 
  PenSquare, Users, MessageSquare, BarChart3, Sparkles,
  TrendingUp, Bell, UserPlus, ChevronRight, Smile, Meh, Frown, 
  Angry, Sun, CloudRain, Wind, Thermometer, Clock, MapPin,
  ZoomIn, Newspaper, Zap, Coffee, Music, Gamepad2, BookOpen, 
  Tv, Film, Utensils, ShoppingBag, Palette, Plane, 
  TrendingUp as TrendingUpIcon, Target, Star, Trophy, Activity, 
  Compass, Radio, Podcast, Video, Youtube, Instagram, Twitter, 
  ExternalLink, AlertCircle, RefreshCw, Globe, Lightbulb, Heart as HeartIcon,
  Moon, Sunrise, Wind as WindIcon, Cloud, Droplets, ThermometerSun,
  Sun as SunIcon, CloudSnow, CloudLightning, PlusCircle, Search, User,  
  Share2, MoreVertical, Camera
} from 'lucide-react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import DateTime from '../components/DateTime'
import Weather from '../components/Weather'

// 导入位置工具函数
import { getGeolocation, saveLocationToStorage } from '../utils/location'

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

// 中文趣味知识库
const CHINESE_FUN_FACTS = [
  "熊猫的消化系统很短，所以它们需要不停地吃竹子来维持能量。",
  "人的一生中，平均会花6个月的时间等红灯。",
  "蜜蜂的翅膀每分钟可以拍动200次。",
  "人的鼻子可以记住5万种不同的气味。",
  "香蕉是浆果，但草莓不是。",
  "闪电的温度比太阳表面高5倍。",
  "章鱼有三颗心脏，两颗负责将血液输送到鳃，一颗负责输送到身体其他部位。",
  "人类是唯一会脸红的动物。",
  "你无法同时呼吸和吞咽。",
  "蜂蜜是唯一永远不会变质的食物。",
]

// 中文笑话库
const CHINESE_JOKES = [
  "为什么程序员喜欢黑暗模式？因为光线会吸引bug！",
  "小明对电脑说：我需要休息。现在每次开机电脑都问：你确定吗？",
  "为什么数学书很伤心？因为它有太多问题。",
  "今天问Siri：生命的意义是什么？它说：我找到了一些网页，有些可能需要付费。",
  "为什么科学家不信任原子？因为它们构成了一切！",
]

// 模拟中文新闻数据
const mockChineseNews = [
  { 
    id: 1, 
    title: 'AI技术新突破，能更准确理解中文语境', 
    category: 'technology', 
    time: '2小时前', 
    source: '科技日报',
    url: 'https://www.ithome.com/',
    isHot: true 
  },
  { 
    id: 2, 
    title: '研究发现：每天散步30分钟可显著提升幸福感', 
    category: 'health', 
    time: '4小时前', 
    source: '健康时报',
    url: 'https://www.jksb.com.cn/'
  },
]

// 帖子图片画廊组件
const PostImageGallery = ({ 
  post, 
  onImageClick 
}: { 
  post: any; 
  onImageClick?: () => void;
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  
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
  
  const displayWidth = 113;
  const displayHeight = 76;
  
  const renderThumbnails = () => {
    const imageCount = galleryImages.length;
    
    if (imageCount === 0) return null;
    
    if (imageCount === 1) {
      return (
        <div style={{ width: `${displayWidth}px`, height: `${displayHeight}px` }}>
          <div 
            className="relative overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800 cursor-pointer group flex items-center justify-center"
            onClick={() => {
              setSelectedImageIndex(0);
              onImageClick?.();
            }}
            style={{ 
              width: `${displayWidth}px`, 
              height: `${displayHeight}px`,
              minWidth: `${displayWidth}px`,
              minHeight: `${displayHeight}px`
            }}
          >
            <img
              src={galleryImages[0].url}
              alt={galleryImages[0].alt || ''}
              style={{ 
                width: `${displayWidth}px`, 
                height: `${displayHeight}px`,
                objectFit: 'contain' as const
              }}
              className="transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
              <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          </div>
        </div>
      );
    }
    
    if (imageCount <= 4) {
      const gridCols = imageCount === 2 ? 'grid-cols-2' : 'grid-cols-2';
      const containerWidth = imageCount === 2 ? displayWidth * 2 + 8 : displayWidth * 2 + 8;
      const containerHeight = imageCount <= 2 ? displayHeight : displayHeight * 2 + 8;
      
      return (
        <div style={{ width: `${containerWidth}px`, height: `${containerHeight}px` }}>
          <div className={`grid ${gridCols} gap-2`}>
            {galleryImages.slice(0, 4).map((image, index) => (
              <div
                key={image.id}
                className="relative overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800 cursor-pointer group flex items-center justify-center"
                onClick={() => {
                  setSelectedImageIndex(index);
                  onImageClick?.();
                }}
                style={{ 
                  width: `${displayWidth}px`, 
                  height: `${displayHeight}px`
                }}
              >
                <img
                  src={image.url}
                  alt={image.alt || ''}
                  style={{ 
                    width: `${displayWidth}px`, 
                    height: `${displayHeight}px`,
                    objectFit: 'cover' as const
                  }}
                  className="transition-transform duration-500 group-hover:scale-110"
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
    
    const containerWidth = displayWidth * 3 + 16;
    const containerHeight = displayHeight * 3 + 16;
    
    return (
      <div style={{ width: `${containerWidth}px`, height: `${containerHeight}px` }}>
        <div className="grid grid-cols-3 gap-2">
          {galleryImages.slice(0, 9).map((image, index) => (
            <div
              key={image.id}
              className="relative overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800 cursor-pointer group flex items-center justify-center"
              onClick={() => {
                setSelectedImageIndex(index);
                onImageClick?.();
              }}
              style={{ 
                width: `${displayWidth}px`, 
                height: `${displayHeight}px`
              }}
            >
              <img
                src={image.url}
                alt={image.alt || ''}
                style={{ 
                  width: `${displayWidth}px`, 
                  height: `${displayHeight}px`,
                  objectFit: 'cover' as const
                }}
                className="transition-transform duration-500 group-hover:scale-110"
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
      
      {selectedImageIndex !== null && (
        <div className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-2 md:p-4">
          <div 
            className="absolute inset-0"
            onClick={() => setSelectedImageIndex(null)}
          />
          
          <div className="relative z-10 w-full h-full flex items-center justify-center">
            <button
              onClick={() => setSelectedImageIndex(null)}
              className="absolute top-4 right-4 md:top-6 md:right-6 p-2 bg-black/50 text-white/90 hover:text-white hover:bg-black/70 rounded-full transition-colors z-20"
              aria-label="关闭"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="relative w-full h-full flex items-center justify-center p-4">
              <div className="flex items-center justify-center w-full h-full">
                <div className="max-w-full max-h-full">
                  <img
                    src={galleryImages[selectedImageIndex].url}
                    alt={galleryImages[selectedImageIndex].alt || ''}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                  />
                </div>
              </div>
              
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
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 text-white hover:bg-black/70 rounded-full transition-colors backdrop-blur-sm z-10"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
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
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 text-white hover:bg-black/70 rounded-full transition-colors backdrop-blur-sm z-10"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
              
              <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                  <div className="text-white">
                    <div className="flex items-center gap-3 mb-2">
                      {galleryImages[selectedImageIndex].uploader?.avatar && (
                        <img
                          src={galleryImages[selectedImageIndex].uploader.avatar}
                          alt={galleryImages[selectedImageIndex].uploader?.name}
                          className="w-8 h-8 rounded-full border-2 border-white/30"
                        />
                      )}
                      <div>
                        <p className="font-medium">
                          {galleryImages[selectedImageIndex].uploader?.name}
                        </p>
                        {galleryImages[selectedImageIndex].createdAt && (
                          <p className="text-sm opacity-75">
                            {new Date(galleryImages[selectedImageIndex].createdAt).toLocaleString('zh-CN')}
                          </p>
                        )}
                      </div>
                    </div>
                    {galleryImages[selectedImageIndex].caption && (
                      <p className="text-sm opacity-90 mt-1 max-w-2xl">
                        {galleryImages[selectedImageIndex].caption}
                      </p>
                    )}
                  </div>
                  <div className="text-white/80 text-sm font-medium bg-black/40 px-3 py-1.5 rounded-full">
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

// 缓存键
const HOME_CACHE_KEY = 'home_page_cache_v2';

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
  
  // 缓存引用 - 用于记录是否已初始化
  const hasInitialized = useRef(false)
  
  // 获取每日格言
  const dailyQuote = useMemo(() => {
    const today = new Date()
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000)
    return DAILY_QUOTES[dayOfYear % DAILY_QUOTES.length]
  }, [])

  // 修改后的 loadAllData 函数 - 支持静默模式
  const loadAllData = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }
    
    try {
      await Promise.all([
        loadPosts(),
        loadStats(),
        loadMoods(),
        loadActivities(),
        loadFriendMoods()
      ]);
      
      // 保存到缓存
      if (user && posts.length > 0) {
        saveToCache();
      }
      
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  // 保存数据到缓存
  const saveToCache = () => {
    if (!user) return;
    
    try {
      const cacheData = {
        userId: user.id,
        posts: posts,
        stats: stats,
        moods: moods,
        activities: activities,
        friendMoods: friendMoods,
        timestamp: Date.now()
      };
      sessionStorage.setItem(HOME_CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('保存缓存失败:', error);
    }
  };

  // 从缓存加载数据
  const loadFromCache = () => {
    try {
      const cachedData = sessionStorage.getItem(HOME_CACHE_KEY);
      if (!cachedData) return false;
      
      const parsed = JSON.parse(cachedData);
      const now = Date.now();
      const CACHE_DURATION = 5 * 60 * 1000; // 5分钟
      
      // 检查缓存是否属于当前用户且在有效期内
      if (parsed.userId === user?.id && parsed.timestamp && (now - parsed.timestamp) < CACHE_DURATION) {
        console.log('✅ 从缓存恢复数据');
        
        // 恢复数据
        if (parsed.posts) setPosts(parsed.posts);
        if (parsed.stats) setStats(parsed.stats);
        if (parsed.moods) setMoods(parsed.moods);
        if (parsed.activities) setActivities(parsed.activities);
        if (parsed.friendMoods) setFriendMoods(parsed.friendMoods);
        
        // 设置今日心情
        if (parsed.moods && parsed.moods.length > 0) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const todaysMood = parsed.moods.find((m: any) => new Date(m.created_at) >= today);
          setTodayMood(todaysMood || null);
        }
        
        return true;
      }
    } catch (error) {
      console.error('读取缓存失败:', error);
    }
    
    return false;
  };

  // 初始化时获取位置
  useEffect(() => {
    const initializeLocation = async () => {
      try {
        const location = await getGeolocation()
        if (location) {
          // 保存位置到本地存储，供 NewPost.tsx 使用
          saveLocationToStorage(location)
          console.log('位置已获取并保存:', location)
        }
      } catch (error) {
        console.error('初始化位置失败:', error)
      }
    }

    initializeLocation()
  }, [])

  // 初始化加载所有数据 - 修改后的版本
  useEffect(() => {
    // 清理旧的缓存
    const cleanupOldCache = () => {
      try {
        const cached = sessionStorage.getItem(HOME_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          // 如果缓存超过1天，清理它
          if (Date.now() - parsed.timestamp > 24 * 60 * 60 * 1000) {
            sessionStorage.removeItem(HOME_CACHE_KEY);
          }
        }
      } catch (error) {
        // 如果缓存格式错误，清理它
        sessionStorage.removeItem(HOME_CACHE_KEY);
      }
    };

    cleanupOldCache();

    if (user && !hasInitialized.current) {
      hasInitialized.current = true;
      
      // 先尝试从缓存加载
      const cacheLoaded = loadFromCache();
      
      if (cacheLoaded) {
        // 缓存加载成功，设置加载完成
        setLoading(false);
        
        // 后台静默更新数据（用户无感知）
        setTimeout(() => {
          console.log('🔄 后台静默更新数据');
          loadAllData(true); // 静默模式
        }, 1000);
      } else {
        // 没有缓存或缓存无效，正常加载
        console.log('🔄 加载新数据');
        loadAllData();
      }
      
      // 组件卸载前保存数据
      return () => {
        if (user && posts.length > 0) {
          saveToCache();
        }
      };
    }
  }, [user]);

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

  // 右侧栏组件
  const RightSidebar = () => {
    // 右侧栏状态
    const [activeNewsCategory, setActiveNewsCategory] = useState('general')
    const [chineseFunFact, setChineseFunFact] = useState('')
    const [chineseJoke, setChineseJoke] = useState('')
    const [refreshKey, setRefreshKey] = useState(0)

    // 中文新闻分类
    const CHINESE_NEWS_CATEGORIES = [
      { id: 'general', name: '综合', icon: Newspaper, color: 'text-blue-500' },
      { id: 'technology', name: '科技', icon: Zap, color: 'text-purple-500' },
      { id: 'finance', name: '财经', icon: TrendingUpIcon, color: 'text-green-500' },
      { id: 'entertainment', name: '娱乐', icon: Film, color: 'text-pink-500' },
      { id: 'sports', name: '体育', icon: Trophy, color: 'text-orange-500' },
      { id: 'health', name: '健康', icon: HeartIcon, color: 'text-red-500' },
    ]

    // 中文趣味工具
    const CHINESE_FUN_TOOLS = [
      {
        icon: Globe,
        title: '世界时间',
        desc: '查看全球时间',
        color: 'bg-blue-100 text-blue-600',
        onClick: () => window.open('https://time.is/zh/', '_blank')
      },
      {
        icon: Lightbulb,
        title: '脑力挑战',
        desc: '趣味知识问答',
        color: 'bg-yellow-100 text-yellow-600',
        onClick: () => window.open('https://www.caiyanpi.com/', '_blank')
      },
      {
        icon: BookOpen,
        title: '每日阅读',
        desc: '推荐优质文章',
        color: 'bg-green-100 text-green-600',
        onClick: () => window.open('https://www.zhihu.com/', '_blank')
      },
      {
        icon: Gamepad2,
        title: '放松一下',
        desc: '在线小游戏',
        color: 'bg-red-100 text-red-600',
        onClick: () => window.open('https://www.yikm.net/', '_blank')
      }
    ]

    // 中文活动推荐
    const CHINESE_ACTIVITIES = [
      {
        icon: Palette,
        title: '在线绘画',
        desc: '尝试数字绘画',
        time: '30分钟',
        link: 'https://www.autodraw.com/'
      },
      {
        icon: Utensils,
        title: '学做新菜',
        desc: '下厨房找食谱',
        time: '1小时',
        link: 'https://www.xiachufang.com/'
      },
      {
        icon: BookOpen,
        title: '听书一刻',
        desc: '喜马拉雅听书',
        time: '20分钟',
        link: 'https://www.ximalaya.com/'
      },
      {
        icon: Plane,
        title: '云旅游',
        desc: '360°看世界',
        time: '15分钟',
        link: 'https://www.zhangzishi.cc/'
      }
    ]

    // 初始化内容
    useEffect(() => {
      // 随机选择趣味知识
      const randomFact = CHINESE_FUN_FACTS[Math.floor(Math.random() * CHINESE_FUN_FACTS.length)]
      setChineseFunFact(randomFact)
      
      // 随机选择笑话
      const randomJoke = CHINESE_JOKES[Math.floor(Math.random() * CHINESE_JOKES.length)]
      setChineseJoke(randomJoke)
    }, [refreshKey])

    // 刷新内容
    const refreshContent = () => {
      setRefreshKey(prev => prev + 1)
    }

    // 过滤新闻
    const filteredNews = useMemo(() => {
      if (activeNewsCategory === 'general') {
        return mockChineseNews
      }
      return mockChineseNews.filter(news => news.category === activeNewsCategory)
    }, [activeNewsCategory])

    return (
      <div className="space-y-6">
        {/* 实时资讯（中文） */}
        <div className="bg-white rounded-3xl shadow-soft p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-terracotta-500" />
              <h3 className="font-semibold text-stone-900">实时资讯</h3>
            </div>
            <button
              onClick={() => setActiveNewsCategory('general')}
              className="text-xs text-stone-400 hover:text-terracotta-500"
            >
              刷新
            </button>
          </div>
          
          {/* 新闻分类 */}
          <div className="flex flex-wrap gap-2 mb-4">
            {CHINESE_NEWS_CATEGORIES.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveNewsCategory(category.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    activeNewsCategory === category.id
                      ? 'bg-stone-900 text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {category.name}
                </button>
              );
            })}
          </div>
          
          {/* 新闻列表 */}
          <div className="space-y-3">
            {filteredNews.slice(0, 5).map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 rounded-xl hover:bg-stone-50 transition-colors border border-stone-100"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {item.isHot && (
                        <div className="flex items-center gap-1 bg-red-50 text-red-600 px-2 py-0.5 rounded-full text-xs font-medium">
                          <Zap className="w-3 h-3" />
                          热
                        </div>
                      )}
                      <span className="text-xs text-stone-400">{item.source}</span>
                    </div>
                    <p className="text-sm font-medium text-stone-900 line-clamp-2 mb-1">
                      {item.title}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-stone-400">{item.time}</span>
                      <ExternalLink className="w-3 h-3 text-stone-300" />
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
          
          <button
            onClick={() => window.open('https://news.baidu.com/', '_blank')}
            className="w-full mt-4 px-4 py-2.5 text-sm text-terracotta-500 hover:bg-terracotta-50 rounded-xl transition-colors flex items-center justify-center gap-1"
          >
            查看更多资讯
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>

        {/* 趣味知识（中文） */}
        <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-3xl shadow-soft p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold text-stone-900">趣味知识</h3>
            <button
              onClick={refreshContent}
              className="ml-auto p-1 text-amber-400 hover:text-amber-500"
              title="换一个知识"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-stone-700 leading-relaxed">{chineseFunFact}</p>
          <div className="mt-2 text-xs text-amber-400">
            来源：科普知识库
          </div>
        </div>

        {/* 每日一笑（中文） */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-3xl shadow-soft p-5">
          <div className="flex items-center gap-2 mb-3">
            <Smile className="w-5 h-5 text-purple-500" />
            <h3 className="font-semibold text-stone-900">每日一笑</h3>
            <button
              onClick={refreshContent}
              className="ml-auto p-1 text-purple-400 hover:text-purple-500"
              title="换一个笑话"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-stone-700 leading-relaxed italic">"{chineseJoke}"</p>
          <div className="mt-2 text-xs text-purple-400">
            来源：中文笑话库
          </div>
        </div>

        {/* 趣味工具（中文） */}
        <div className="bg-white rounded-3xl shadow-soft p-5">
          <h3 className="font-semibold text-stone-900 mb-4">趣味工具</h3>
          <div className="grid grid-cols-2 gap-3">
            {CHINESE_FUN_TOOLS.map((tool, index) => {
              const Icon = tool.icon;
              return (
                <button
                  key={index}
                  onClick={tool.onClick}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-stone-50 transition-colors group"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${tool.color.split(' ')[0]} group-hover:scale-105 transition-transform`}>
                    <Icon className={`w-6 h-6 ${tool.color.split(' ')[1]}`} />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-medium text-stone-800">{tool.title}</p>
                    <p className="text-xs text-stone-500">{tool.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 活动推荐（中文） */}
        <div className="bg-white rounded-3xl shadow-soft p-5">
          <h3 className="font-semibold text-stone-900 mb-4">今日活动推荐</h3>
          <div className="space-y-3">
            {CHINESE_ACTIVITIES.map((activity, index) => {
              const Icon = activity.icon;
              return (
                <a
                  key={index}
                  href={activity.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-stone-50 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                    <Icon className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-stone-800">{activity.title}</p>
                    <p className="text-xs text-stone-500">{activity.desc}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-stone-400 bg-stone-100 px-2 py-1 rounded-full">
                      {activity.time}
                    </span>
                    <ExternalLink className="w-3 h-3 text-stone-300 group-hover:text-stone-400" />
                  </div>
                </a>
              );
            })}
          </div>
        </div>

        {/* 实用链接 */}
        <div className="bg-stone-50 rounded-3xl p-5 border border-stone-200">
          <h3 className="font-semibold text-stone-900 mb-3">实用链接</h3>
          <div className="space-y-2">
            <a 
              href="https://www.weather.com.cn/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-stone-600 hover:text-terracotta-500 p-2 hover:bg-white rounded-xl transition-colors"
            >
              <Cloud className="w-4 h-4" />
              中国天气网
            </a>
            <a 
              href="https://www.toutiao.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-stone-600 hover:text-terracotta-500 p-2 hover:bg-white rounded-xl transition-colors"
            >
              <Newspaper className="w-4 h-4" />
              今日头条
            </a>
            <a 
              href="https://www.zhihu.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-stone-600 hover:text-terracotta-500 p-2 hover:bg-white rounded-xl transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              知乎
            </a>
            <a 
              href="https://www.bilibili.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-stone-600 hover:text-terracotta-500 p-2 hover:bg-white rounded-xl transition-colors"
            >
              <Video className="w-4 h-4" />
              B站
            </a>
          </div>
        </div>
      </div>
    );
  };

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
      <div className="max-w-7xl mx-auto p-4 pb-24 md:pb-4">
        {/* 顶部：日期天气 */}
        <div className="mb-6">
          <div className="bg-white rounded-3xl shadow-soft p-5">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <DateTime />
              <Weather />
            </div>
          </div>
        </div>

        {/* 三栏布局 */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* 左侧栏 */}
          <div className="lg:w-1/4 space-y-6">
            {/* 每日格言 */}
            <div className="bg-gradient-to-br from-terracotta-50 to-cream rounded-3xl shadow-soft p-5">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-terracotta-500" />
                <span className="text-xs font-medium text-terracotta-600">每日格言</span>
              </div>
              <p className="text-stone-700 text-sm leading-relaxed italic">"{dailyQuote.text}"</p>
              <p className="text-stone-400 text-xs mt-2 text-right">—— {dailyQuote.author}</p>
            </div>

            {/* 心情记录卡片 */}
            <div className="bg-white rounded-3xl shadow-soft p-5">
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
            <div className="bg-white rounded-3xl shadow-soft p-5">
              <h3 className="font-semibold text-stone-900 mb-4">我的数据</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-br from-terracotta-50 to-terracotta-100/50 rounded-2xl p-3 text-center">
                  <BarChart3 className="w-5 h-5 text-terracotta-500 mx-auto mb-1" />
                  <p className="text-xl font-bold text-terracotta-600">{stats.weekPosts}</p>
                  <p className="text-xs text-stone-500">本周发布</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-2xl p-3 text-center">
                  <Users className="w-5 h-5 text-green-500 mx-auto mb-1" />
                  <p className="text-xl font-bold text-green-600">{stats.friends}</p>
                  <p className="text-xs text-stone-500">好友数</p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-3 text-center">
                  <MessageSquare className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                  <p className="text-xl font-bold text-blue-600">{stats.comments}</p>
                  <p className="text-xs text-stone-500">发出评论</p>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-2xl p-3 text-center">
                  <PenSquare className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                  <p className="text-xl font-bold text-amber-600">{stats.totalPosts}</p>
                  <p className="text-xs text-stone-500">累计记录</p>
                </div>
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

          {/* 中间栏 */}
          <div className="lg:w-2/4 space-y-6">
            {/* 快速发布 */}
            <div className="bg-white rounded-3xl shadow-soft p-5">
              <h3 className="font-semibold text-stone-900 mb-4">分享新鲜事</h3>
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

            {/* 好友动态列表 */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-stone-900">好友动态</h2>
                <button 
                  onClick={() => {
                    // 清除缓存并强制刷新
                    sessionStorage.removeItem(HOME_CACHE_KEY);
                    hasInitialized.current = false;
                    setLoading(true);
                    loadAllData();
                  }}
                  className="text-sm text-terracotta-500 hover:text-terracotta-600 transition-colors flex items-center gap-1"
                >
                  <RefreshCw className="w-4 h-4" />
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

                      {/* Post Images */}
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
          </div>

          {/* 右侧栏 */}
          <div className="lg:w-1/4">
            <RightSidebar />
          </div>
        </div>
      </div>
    </Layout>
  )
}
