import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { 
  ArrowLeft, Image, X, Send, Loader2, MapPin, MapPinOff, 
  Globe, Building2, Camera, Smile, Tag, Users, Lock, Globe as Earth
} from 'lucide-react'

export default function NewPost() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [content, setContent] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // NewPost.tsx 的 useEffect 中
useEffect(() => {
  const storedLocation = localStorage.getItem('sharedLocation')
  if (storedLocation) {
    try {
      const locationData = JSON.parse(storedLocation)
      // 检查是否在1小时内（可调整）
      if (Date.now() - locationData.timestamp < 60 * 60 * 1000) {
        setSelectedLocation(locationData.name)
        setLastLocationTime(locationData.timestamp)
        setShowLocation(true)
        setUsingCurrentLocation(true)
      }
    } catch (error) {
      console.error('读取位置失败:', error)
    }
  }
}, [])
  
  // 位置相关状态
  const [showLocation, setShowLocation] = useState(false)
  const [locationText, setLocationText] = useState('')
  const [suggestedLocations, setSuggestedLocations] = useState<string[]>([
    '北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '南京', 
    '西安', '重庆', '苏州', '天津', '厦门', '青岛', '长沙'
  ])
  
  // 隐私设置
  const [privacy, setPrivacy] = useState<'public' | 'friends' | 'private'>('friends')
  const privacyOptions = [
    { id: 'public', icon: Earth, label: '公开', desc: '所有人可见' },
    { id: 'friends', icon: Users, label: '仅朋友', desc: '仅朋友可见' },
    { id: 'private', icon: Lock, label: '仅自己', desc: '仅自己可见' }
  ]

  // 表情符号选择器状态
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const commonEmojis = ['😊', '👍', '❤️', '🎉', '😄', '🌟', '📷', '🍕', '☕', '🎈']

  // 标签功能
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const suggestedTags = ['生活', '美食', '旅行', '工作', '学习', '运动', '娱乐', '日常']

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length + images.length > 9) {
      alert('最多上传9张图片')
      return
    }
    
    const validFiles = files.filter(file => {
      // 检查文件类型
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg']
      if (!validTypes.includes(file.type)) {
        alert(`文件 ${file.name} 格式不支持，请选择图片文件`)
        return false
      }
      
      // 检查文件大小（最大5MB）
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        alert(`文件 ${file.name} 太大，请选择小于5MB的图片`)
        return false
      }
      
      return true
    })
    
    if (validFiles.length === 0) return
    
    setImages([...images, ...validFiles])
    
    // 生成预览
    validFiles.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviews(prev => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    const newImages = [...images]
    const newPreviews = [...previews]
    
    newImages.splice(index, 1)
    newPreviews.splice(index, 1)
    
    setImages(newImages)
    setPreviews(newPreviews)
  }

  const uploadImages = async (): Promise<string[]> => {
    if (images.length === 0) return []
    
    const urls: string[] = []
    
    // 使用Promise.all并行上传
    const uploadPromises = images.map(async (file) => {
      const fileName = `${user?.id}/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${file.name.split('.').pop()}`
      try {
        const { data, error } = await supabase.storage.from('posts').upload(fileName, file)
        if (error) throw error
        
        const { data: urlData } = supabase.storage.from('posts').getPublicUrl(data.path)
        return urlData.publicUrl
      } catch (error) {
        console.error('图片上传失败:', error)
        return null
      }
    })
    
    const results = await Promise.all(uploadPromises)
    return results.filter((url): url is string => url !== null)
  }

  const handleSubmit = async () => {
    if (!content.trim() && images.length === 0) {
      alert('请填写内容或添加图片')
      return
    }
    
    if (!user) {
      alert('请先登录')
      navigate('/login')
      return
    }

    setLoading(true)
    
    try {
      // 上传图片
      let imageUrls: string[] = []
      if (images.length > 0) {
        const urls = await uploadImages()
        if (urls.length !== images.length) {
          alert('部分图片上传失败，请重试')
          setLoading(false)
          return
        }
        imageUrls = urls
      }

      // 准备帖子数据
      const postData = {
        user_id: user.id,
        content: content.trim(),
        image_urls: imageUrls.length > 0 ? imageUrls : null,
        visibility: privacy,
        location_name: showLocation && locationText.trim() ? locationText.trim() : null,
        show_location: showLocation,
        tags: tags.length > 0 ? tags : null,
        created_at: new Date().toISOString()
      }

      // 插入帖子
      const { error } = await supabase.from('posts').insert([postData])

      if (error) {
        throw error
      }

      // 发布成功，返回首页
      navigate('/', { 
        replace: true,
        state: { showSuccess: true }
      })
      
    } catch (error: any) {
      console.error('发布失败:', error)
      alert(`发布失败: ${error.message || '请稍后重试'}`)
    } finally {
      setLoading(false)
    }
  }

  // 添加标签
  const addTag = (tag: string) => {
    const trimmedTag = tag.trim()
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 5) {
      setTags([...tags, trimmedTag])
      setTagInput('')
    }
  }

  // 移除标签
  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index))
  }

  // 添加表情符号到内容
  const addEmoji = (emoji: string) => {
    setContent(prev => prev + emoji)
    setShowEmojiPicker(false)
  }

  // 选择位置
  const selectLocation = (location: string) => {
    setLocationText(location)
    setShowLocation(true)
  }

  // 计算剩余字数
  const charCount = content.length
  const maxChars = 1000

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 backdrop-blur-sm bg-white/95">
        <div className="flex items-center justify-between px-4 py-3 max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="返回"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="font-bold text-lg text-gray-900">发布动态</h1>
          </div>
          
          <button
            onClick={handleSubmit}
            disabled={loading || (!content.trim() && images.length === 0)}
            className={`px-5 py-2 rounded-full font-medium flex items-center gap-2 transition-all ${
              loading || (!content.trim() && images.length === 0)
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-lg transform hover:-translate-y-0.5'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                发布中
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                发布
              </>
            )}
          </button>
        </div>
      </header>

      <main className="pb-20 pt-4 px-4 max-w-4xl mx-auto">
        {/* 发布者信息 */}
        <div className="flex items-start gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
            {user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{user?.email?.split('@')[0] || '用户'}</h3>
            <p className="text-sm text-gray-500">现在</p>
          </div>
        </div>

        {/* 内容输入区域 */}
        <div className="mb-6">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="分享你的生活瞬间..."
            className="w-full min-h-[180px] p-4 text-lg bg-white rounded-2xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none transition-all placeholder-gray-400"
            autoFocus
            maxLength={maxChars}
          />
          
          {/* 字符计数 */}
          <div className="flex justify-end mt-2">
            <span className={`text-sm ${charCount > maxChars * 0.8 ? 'text-amber-600' : 'text-gray-400'}`}>
              {charCount} / {maxChars}
            </span>
          </div>
        </div>

        {/* 图片预览区域 */}
        {previews.length > 0 && (
          <div className="mb-6">
            <div className={`grid gap-3 ${previews.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {previews.map((preview, index) => (
                <div key={index} className="relative group rounded-2xl overflow-hidden shadow-sm">
                  <img 
                    src={preview} 
                    alt="" 
                    className="w-full h-48 object-cover transition-transform group-hover:scale-105" 
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all opacity-0 group-hover:opacity-100"
                    aria-label="删除图片"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 text-white text-sm">
                    图片 {index + 1} / {previews.length}
                  </div>
                </div>
              ))}
            </div>
            
            {images.length < 9 && (
              <p className="text-sm text-gray-500 mt-2 text-center">
                还可添加 {9 - images.length} 张图片
              </p>
            )}
          </div>
        )}

        {/* 功能工具栏 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-4 gap-4">
            {/* 添加图片 */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center p-3 rounded-xl hover:bg-gray-50 transition-colors group"
            >
              <div className="p-3 bg-blue-50 rounded-full mb-2 group-hover:bg-blue-100 transition-colors">
                <Camera className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">图片</span>
              <span className="text-xs text-gray-500">{images.length}/9</span>
            </button>

            {/* 位置 */}
            <button
              onClick={() => setShowLocation(!showLocation)}
              className="flex flex-col items-center justify-center p-3 rounded-xl hover:bg-gray-50 transition-colors group"
            >
              <div className={`p-3 rounded-full mb-2 transition-colors ${
                showLocation ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
              }`}>
                {showLocation ? <MapPin className="w-5 h-5" /> : <MapPinOff className="w-5 h-5" />}
              </div>
              <span className="text-sm font-medium text-gray-700">位置</span>
              <span className="text-xs text-gray-500 truncate w-full">
                {showLocation ? (locationText || '添加位置') : '关闭'}
              </span>
            </button>

            {/* 表情符号 */}
            <div className="relative">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="w-full flex flex-col items-center justify-center p-3 rounded-xl hover:bg-gray-50 transition-colors group"
              >
                <div className="p-3 bg-yellow-50 rounded-full mb-2 group-hover:bg-yellow-100 transition-colors">
                  <Smile className="w-5 h-5 text-yellow-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">表情</span>
              </button>
              
              {/* 表情选择器 */}
              {showEmojiPicker && (
                <div className="absolute z-10 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg p-3 w-64">
                  <div className="grid grid-cols-5 gap-2">
                    {commonEmojis.map((emoji, index) => (
                      <button
                        key={index}
                        onClick={() => addEmoji(emoji)}
                        className="p-2 hover:bg-gray-100 rounded-lg text-lg transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 标签 */}
            <button
              onClick={() => document.getElementById('tagInput')?.focus()}
              className="flex flex-col items-center justify-center p-3 rounded-xl hover:bg-gray-50 transition-colors group"
            >
              <div className="p-3 bg-purple-50 rounded-full mb-2 group-hover:bg-purple-100 transition-colors">
                <Tag className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">标签</span>
              <span className="text-xs text-gray-500">{tags.length}/5</span>
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageSelect}
            className="hidden"
          />
        </div>

        {/* 位置输入区域 */}
        {showLocation && (
          <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5 text-gray-500" />
              <h3 className="font-medium text-gray-900">添加位置</h3>
            </div>
            
            <div className="space-y-3">
              <input
                type="text"
                value={locationText}
                onChange={(e) => setLocationText(e.target.value)}
                placeholder="输入位置名称，如：北京三里屯、上海外滩..."
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
              
              {/* 热门城市推荐 */}
              <div>
                <p className="text-sm text-gray-500 mb-2">热门城市：</p>
                <div className="flex flex-wrap gap-2">
                  {suggestedLocations.map((city, index) => (
                    <button
                      key={index}
                      onClick={() => selectLocation(city)}
                      className={`px-3 py-1.5 text-sm rounded-full transition-all ${
                        locationText === city
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 标签管理区域 */}
        {(tags.length > 0 || tagInput) && (
          <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Tag className="w-5 h-5 text-gray-500" />
              <h3 className="font-medium text-gray-900">标签</h3>
              <span className="text-sm text-gray-500 ml-auto">{tags.length}/5</span>
            </div>
            
            <div className="space-y-3">
              {/* 已添加的标签 */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <div
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm"
                    >
                      #{tag}
                      <button
                        onClick={() => removeTag(index)}
                        className="p-0.5 hover:bg-blue-100 rounded-full"
                        aria-label="移除标签"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* 标签输入和推荐 */}
              <div className="space-y-2">
                <input
                  id="tagInput"
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && tagInput.trim()) {
                      addTag(tagInput)
                    }
                  }}
                  placeholder="输入标签，按Enter添加"
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm"
                />
                
                {/* 推荐标签 */}
                <div className="flex flex-wrap gap-2">
                  {suggestedTags.map((tag, index) => (
                    <button
                      key={index}
                      onClick={() => addTag(tag)}
                      disabled={tags.includes(tag) || tags.length >= 5}
                      className={`px-3 py-1 text-sm rounded-full transition-all ${
                        tags.includes(tag) || tags.length >= 5
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 隐私设置 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6">
          <h3 className="font-medium text-gray-900 mb-4">谁可以看</h3>
          
          <div className="grid grid-cols-3 gap-3">
            {privacyOptions.map((option) => {
              const Icon = option.icon
              const isSelected = privacy === option.id
              
              return (
                <button
                  key={option.id}
                  onClick={() => setPrivacy(option.id as any)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`p-2 rounded-full mb-3 w-fit ${
                    isSelected ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="font-medium text-gray-900">{option.label}</h4>
                  <p className="text-xs text-gray-500 mt-1">{option.desc}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* 发布提示 */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <Send className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-blue-900 mb-1">发布提示</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 请遵守社区规范，发布积极健康的内容</li>
                <li>• 保护个人隐私，避免泄露敏感信息</li>
                <li>• 尊重他人，友好交流</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* 底部固定操作栏 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <Camera className="w-4 h-4" />
              <span className="text-sm font-medium">添加图片</span>
            </button>
            
            {showLocation ? (
              <button
                onClick={() => setShowLocation(false)}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 hover:bg-green-200 text-green-700 transition-colors"
              >
                <MapPin className="w-4 h-4" />
                <span className="text-sm font-medium truncate max-w-[100px]">
                  {locationText || '添加位置'}
                </span>
              </button>
            ) : (
              <button
                onClick={() => setShowLocation(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <MapPinOff className="w-4 h-4" />
                <span className="text-sm font-medium">添加位置</span>
              </button>
            )}
          </div>
          
          <button
            onClick={handleSubmit}
            disabled={loading || (!content.trim() && images.length === 0)}
            className={`px-6 py-2.5 rounded-full font-medium flex items-center gap-2 transition-all min-w-[100px] justify-center ${
              loading || (!content.trim() && images.length === 0)
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-lg'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                发布中
              </>
            ) : (
              '发布'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
