import { useState, useRef, useEffect } from 'react' // 确保导入所有 hooks
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { 
  ArrowLeft, Image, X, Send, Loader2, MapPin, MapPinOff, 
  Globe, Building2, Camera, Smile, Tag, Users, Lock, 
  Check, Clock, Home as HomeIcon
} from 'lucide-react'

export default function NewPost() {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  // 基础状态
  const [content, setContent] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // 位置相关状态 - 确保正确定义所有状态
  const [showLocation, setShowLocation] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<string>('')
  const [usingCurrentLocation, setUsingCurrentLocation] = useState(false)
  const [lastLocationTime, setLastLocationTime] = useState<number | null>(null)
  
  // 隐私设置
  const [privacy, setPrivacy] = useState<'public' | 'friends' | 'private'>('friends')
  const privacyOptions = [
    { id: 'public', icon: Globe, label: '公开', desc: '所有人可见' },
    { id: 'friends', icon: Users, label: '仅朋友', desc: '仅朋友可见' },
    { id: 'private', icon: Lock, label: '仅自己', desc: '仅自己可见' }
  ]

  // 常用位置
  const popularLocations = [
    '家里', '公司', '学校', '咖啡馆', '餐厅', '健身房',
    '公园', '电影院', '商场', '图书馆', '医院', '银行'
  ]

  // 常用城市
  const popularCities = [
    '北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '南京', 
    '西安', '重庆', '苏州', '天津', '厦门', '青岛', '长沙', '大连'
  ]

  // 初始化位置信息 - 使用 useEffect
  useEffect(() => {
    // 检查 localStorage 中的共享位置
    const storedLocation = localStorage.getItem('sharedLocation')
    if (storedLocation) {
      try {
        const locationData = JSON.parse(storedLocation)
        // 检查位置是否在 1 小时内（可调整时间）
        if (Date.now() - locationData.timestamp < 60 * 60 * 1000) {
          setSelectedLocation(locationData.name)
          setLastLocationTime(locationData.timestamp)
          setUsingCurrentLocation(true)
          // 自动开启位置显示
          setShowLocation(true)
        }
      } catch (error) {
        console.error('读取存储的位置失败:', error)
      }
    }
  }, [])

  // 处理图片选择
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length + images.length > 9) {
      alert('最多上传9张图片')
      return
    }
    
    const validFiles = files.filter(file => {
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg']
      if (!validTypes.includes(file.type)) {
        alert(`文件 ${file.name} 格式不支持`)
        return false
      }
      
      const maxSize = 5 * 1024 * 1024
      if (file.size > maxSize) {
        alert(`文件 ${file.name} 太大，请选择小于5MB的图片`)
        return false
      }
      
      return true
    })
    
    if (validFiles.length === 0) return
    
    setImages([...images, ...validFiles])
    
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

  // 上传图片
  const uploadImages = async (): Promise<string[]> => {
    if (images.length === 0) return []
    
    const urls: string[] = []
    
    for (const file of images) {
      try {
        const fileName = `${user?.id}/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${file.name.split('.').pop()}`
        const { data, error } = await supabase.storage.from('posts').upload(fileName, file)
        
        if (error) throw error
        
        const { data: urlData } = supabase.storage.from('posts').getPublicUrl(data.path)
        urls.push(urlData.publicUrl)
      } catch (error) {
        console.error('图片上传失败:', error)
      }
    }
    
    return urls
  }

  // 处理发布
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
        imageUrls = await uploadImages()
      }

      // 准备帖子数据
      const postData = {
        user_id: user.id,
        content: content.trim(),
        image_urls: imageUrls.length > 0 ? imageUrls : null,
        visibility: privacy,
        location_name: showLocation && selectedLocation.trim() ? selectedLocation.trim() : null,
        show_location: showLocation,
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

  // 格式化时间差
  const formatTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    return `${days}天前`
  }

  // 选择位置函数
  const selectLocation = (location: string) => {
    setSelectedLocation(location)
    setUsingCurrentLocation(false)
  }

  // 字符计数
  const charCount = content.length
  const maxChars = 1000

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* 顶部导航栏 */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3 max-w-3xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="返回"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          
          <h1 className="font-bold text-lg text-gray-900">发布动态</h1>
          
          <button
            onClick={handleSubmit}
            disabled={loading || (!content.trim() && images.length === 0)}
            className={`px-6 py-2 rounded-full font-medium flex items-center gap-2 transition-all ${
              loading || (!content.trim() && images.length === 0)
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg hover:scale-105 active:scale-95'
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

      <main className="pb-24 pt-4 px-4 max-w-3xl mx-auto">
        {/* 内容编辑区 */}
        <div className="mb-6">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="这一刻的想法..."
            className="w-full min-h-[200px] p-5 text-lg bg-white rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 resize-none transition-all placeholder-gray-400 shadow-sm"
            autoFocus
            maxLength={maxChars}
          />
          
          {/* 字符计数 */}
          <div className="flex justify-between items-center mt-2 px-1">
            <div className="flex items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
              >
                <Camera className="w-4 h-4" />
                添加图片 ({images.length}/9)
              </button>
              
              <button
                onClick={() => setShowLocation(!showLocation)}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-full transition-colors ${
                  showLocation 
                    ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <MapPin className="w-4 h-4" />
                位置
              </button>
            </div>
            
            <span className={`text-sm ${charCount > maxChars * 0.9 ? 'text-red-500' : 'text-gray-400'}`}>
              {charCount}/{maxChars}
            </span>
          </div>
        </div>

        {/* 图片预览 */}
        {previews.length > 0 && (
          <div className="mb-6">
            <div className={`grid gap-3 ${previews.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {previews.map((preview, index) => (
                <div key={index} className="relative group rounded-xl overflow-hidden shadow-md">
                  <img 
                    src={preview} 
                    alt="" 
                    className="w-full h-48 object-cover" 
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition-all"
                    aria-label="删除图片"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 位置选择器 */}
        {showLocation && (
          <div className="mb-6 bg-white rounded-2xl border-2 border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MapPin className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">添加位置</h3>
                  <p className="text-sm text-gray-500">让朋友知道你在哪里</p>
                </div>
              </div>
              
              <button
                onClick={() => {
                  setShowLocation(false)
                  setSelectedLocation('')
                  setUsingCurrentLocation(false)
                }}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* 当前/最后已知位置 */}
            {(usingCurrentLocation && selectedLocation) && (
              <div className="mb-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg mt-0.5">
                      <MapPin className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-blue-800">{selectedLocation}</span>
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                          当前位置
                        </span>
                      </div>
                      {lastLocationTime && (
                        <div className="flex items-center gap-1 text-sm text-blue-600">
                          <Clock className="w-3 h-3" />
                          <span>{formatTimeAgo(lastLocationTime)}更新</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Check className="w-5 h-5 text-green-500" />
                </div>
              </div>
            )}

            {/* 位置搜索/输入 */}
            <div className="mb-4">
              <input
                type="text"
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                placeholder="搜索或输入位置..."
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>

            {/* 常用位置 */}
            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                <HomeIcon className="w-4 h-4" />
                常用位置
              </h4>
              <div className="flex flex-wrap gap-2">
                {popularLocations.map((location, index) => (
                  <button
                    key={index}
                    onClick={() => selectLocation(location)}
                    className={`px-3 py-1.5 text-sm rounded-full transition-all ${
                      selectedLocation === location
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {location}
                  </button>
                ))}
              </div>
            </div>

            {/* 热门城市 */}
            <div>
              <h4 className="font-medium text-gray-700 mb-2">热门城市</h4>
              <div className="grid grid-cols-3 gap-2">
                {popularCities.map((city, index) => (
                  <button
                    key={index}
                    onClick={() => selectLocation(city)}
                    className={`px-3 py-2 text-sm rounded-xl transition-all text-center ${
                      selectedLocation === city
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 隐私设置 */}
        <div className="mb-6 bg-white rounded-2xl border-2 border-gray-200 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">谁可以看</h3>
          
          <div className="grid grid-cols-3 gap-3">
            {privacyOptions.map((option) => {
              const isSelected = privacy === option.id
              const Icon = option.icon
              
              return (
                <button
                  key={option.id}
                  onClick={() => setPrivacy(option.id as any)}
                  className={`p-4 rounded-xl border-2 transition-all text-center ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`p-2 rounded-full mb-3 w-fit mx-auto ${
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
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Send className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">发布提示</h4>
              <ul className="text-sm text-blue-800 space-y-1.5">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5"></div>
                  <span>分享生活中的美好瞬间</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5"></div>
                  <span>添加位置让朋友知道你在哪里</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5"></div>
                  <span>选择适合的隐私设置保护个人信息</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageSelect}
          className="hidden"
        />
      </main>

      {/* 底部浮动操作栏 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
            >
              <Camera className="w-5 h-5" />
              <span className="text-sm font-medium">图片</span>
              {images.length > 0 && (
                <span className="text-xs bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                  {images.length}
                </span>
              )}
            </button>
            
            <button
              onClick={() => setShowLocation(!showLocation)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                showLocation
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <MapPin className="w-5 h-5" />
              <span className="text-sm font-medium">位置</span>
              {selectedLocation && (
                <span className="text-xs bg-green-500 text-white rounded-full px-2 py-0.5">
                  ✓
                </span>
              )}
            </button>
          </div>
          
          <button
            onClick={handleSubmit}
            disabled={loading || (!content.trim() && images.length === 0)}
            className={`px-6 py-3 rounded-full font-medium flex items-center gap-2 transition-all ${
              loading || (!content.trim() && images.length === 0)
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg hover:scale-105 active:scale-95 shadow-md'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>发布中...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span className="font-semibold">发布动态</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
