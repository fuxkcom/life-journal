// src/pages/NewPost.tsx
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { 
  ArrowLeft, Image, X, Send, Loader2, MapPin, MapPinOff, 
  Globe, Building2, Camera, Users, Lock, Clock, HomeIcon, RefreshCw
} from 'lucide-react'

// 导入位置工具函数
import { 
  getLocationFromStorage, 
  reverseGeocodeWithNominatim,
  getLocationByIP 
} from '../utils/location.ts'

export default function NewPost() {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  // 基础状态
  const [content, setContent] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // 位置相关状态
  const [showLocation, setShowLocation] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<string>('')
  const [usingCurrentLocation, setUsingCurrentLocation] = useState(false)
  const [lastLocationTime, setLastLocationTime] = useState<number | null>(null)
  
  // 定位过程状态
  const [isLocating, setIsLocating] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  
  // 隐私设置
  const [privacy, setPrivacy] = useState<'public' | 'friends' | 'private'>('friends')

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

  // 初始化位置信息（从 Home 保存的存储中读取）
  useEffect(() => {
    const storedLocation = getLocationFromStorage()
    if (storedLocation) {
      setSelectedLocation(storedLocation.name)
      setLastLocationTime(storedLocation.timestamp)
      setUsingCurrentLocation(true)
      // 不自动设置 showLocation，让用户点击位置按钮后再显示
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

  // 刷新当前位置（定位）
  const handleRefreshLocation = async () => {
    setIsLocating(true)
    setLocationError(null)

    // 定位函数：先尝试浏览器定位，失败则 IP 定位
    const getCoords = (): Promise<{ lat: number; lon: number }> => {
      return new Promise((resolve, reject) => {
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude })
            },
            async (err) => {
              console.warn('浏览器定位失败，尝试 IP 定位', err)
              const ipLoc = await getLocationByIP()
              if (ipLoc) {
                resolve({ lat: ipLoc.lat, lon: ipLoc.lon })
              } else {
                reject(new Error('无法获取位置，请手动输入'))
              }
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
          )
        } else {
          // 不支持定位，直接尝试 IP
          getLocationByIP().then(ipLoc => {
            if (ipLoc) resolve({ lat: ipLoc.lat, lon: ipLoc.lon })
            else reject(new Error('浏览器不支持定位，请手动输入'))
          })
        }
      })
    }

    try {
      const { lat, lon } = await getCoords()
      // 逆地理编码获取地点名称
      const locationName = await reverseGeocodeWithNominatim(lat, lon)
      setSelectedLocation(locationName)
      setUsingCurrentLocation(true)
      setLastLocationTime(Date.now())
    } catch (error: any) {
      setLocationError(error.message || '定位失败')
    } finally {
      setIsLocating(false)
    }
  }

  // 字符计数
  const charCount = content.length
  const maxChars = 1000

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 (不变) */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
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
                : 'bg-blue-500 text-white hover:bg-blue-600'
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
        {/* 内容编辑区 (不变) */}
        <div className="mb-6">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="这一刻的想法..."
            className="w-full min-h-[200px] p-5 text-lg bg-white rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none transition-all"
            autoFocus
            maxLength={maxChars}
          />
          
          {/* 字符计数 */}
          <div className="flex justify-end mt-2">
            <span className={`text-sm ${charCount > maxChars * 0.9 ? 'text-red-500' : 'text-gray-400'}`}>
              {charCount}/{maxChars}
            </span>
          </div>
        </div>

        {/* 图片预览 (不变) */}
        {previews.length > 0 && (
          <div className="mb-6">
            <div className={`grid gap-3 ${previews.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {previews.map((preview, index) => (
                <div key={index} className="relative rounded-lg overflow-hidden">
                  <img 
                    src={preview} 
                    alt="" 
                    className="w-full h-48 object-cover" 
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full"
                    aria-label="删除图片"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 位置选择器 - 修改部分 */}
        {showLocation && (
          <div className="mb-6 bg-white rounded-xl border border-gray-300 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">添加位置</h3>
              </div>
              
              <button
                onClick={() => setShowLocation(false)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* 当前/最后已知位置 - 增加刷新按钮 */}
            {(usingCurrentLocation && selectedLocation) && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-start justify-between">
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
                  <button
                    onClick={handleRefreshLocation}
                    disabled={isLocating}
                    className="p-2 hover:bg-blue-100 rounded-full text-blue-600 disabled:opacity-50"
                    title="刷新位置"
                  >
                    {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* 定位错误提示 */}
            {locationError && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                定位失败: {locationError}
              </div>
            )}

            {/* 位置输入 */}
            <div className="mb-4">
              <input
                type="text"
                value={selectedLocation}
                onChange={(e) => {
                  setSelectedLocation(e.target.value)
                  // 如果用户手动修改，取消“使用当前位置”标记
                  setUsingCurrentLocation(false)
                }}
                placeholder="输入位置..."
                className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* 刷新按钮（当未使用当前位置时显示） */}
            {!usingCurrentLocation && (
              <div className="mb-4">
                <button
                  onClick={handleRefreshLocation}
                  disabled={isLocating}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  {isLocating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      定位中...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      刷新当前位置
                    </>
                  )}
                </button>
              </div>
            )}

            {/* 常用位置 (不变) */}
            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">常用位置</h4>
              <div className="flex flex-wrap gap-2">
                {popularLocations.map((location, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedLocation(location)
                      setUsingCurrentLocation(false)
                    }}
                    className={`px-3 py-1 text-sm rounded-full ${
                      selectedLocation === location
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {location}
                  </button>
                ))}
              </div>
            </div>

            {/* 热门城市 (不变) */}
            <div>
              <h4 className="font-medium text-gray-700 mb-2">热门城市</h4>
              <div className="grid grid-cols-3 gap-2">
                {popularCities.map((city, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedLocation(city)
                      setUsingCurrentLocation(false)
                    }}
                    className={`px-3 py-2 text-sm rounded-lg text-center ${
                      selectedLocation === city
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-300'
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 隐私设置 (不变) */}
        <div className="mb-6 bg-white rounded-xl border border-gray-300 p-4">
          <h3 className="font-semibold text-gray-900 mb-4">谁可以看</h3>
          
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setPrivacy('public')}
              className={`p-4 rounded-lg border-2 text-center ${
                privacy === 'public'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`p-2 rounded-full mb-3 w-fit mx-auto ${
                privacy === 'public' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
              }`}>
                <Globe className="w-5 h-5" />
              </div>
              <h4 className="font-medium text-gray-900">公开</h4>
              <p className="text-xs text-gray-500 mt-1">所有人可见</p>
            </button>
            
            <button
              onClick={() => setPrivacy('friends')}
              className={`p-4 rounded-lg border-2 text-center ${
                privacy === 'friends'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`p-2 rounded-full mb-3 w-fit mx-auto ${
                privacy === 'friends' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
              }`}>
                <Users className="w-5 h-5" />
              </div>
              <h4 className="font-medium text-gray-900">仅朋友</h4>
              <p className="text-xs text-gray-500 mt-1">仅朋友可见</p>
            </button>
            
            <button
              onClick={() => setPrivacy('private')}
              className={`p-4 rounded-lg border-2 text-center ${
                privacy === 'private'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`p-2 rounded-full mb-3 w-fit mx-auto ${
                privacy === 'private' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
              }`}>
                <Lock className="w-5 h-5" />
              </div>
              <h4 className="font-medium text-gray-900">仅自己</h4>
              <p className="text-xs text-gray-500 mt-1">仅自己可见</p>
            </button>
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

      {/* 底部操作栏 (修改位置按钮行为) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full"
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
              onClick={() => {
                setShowLocation(!showLocation)
                // 如果打开位置面板且尚未选择位置，自动尝试刷新当前位置（可选）
                if (!showLocation && !selectedLocation) {
                  handleRefreshLocation()
                }
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                showLocation
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <MapPin className="w-5 h-5" />
              <span className="text-sm font-medium">位置</span>
            </button>
          </div>
          
          <button
            onClick={handleSubmit}
            disabled={loading || (!content.trim() && images.length === 0)}
            className={`px-6 py-2 rounded-full font-medium ${
              loading || (!content.trim() && images.length === 0)
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {loading ? '发布中...' : '发布'}
          </button>
        </div>
      </div>
    </div>
  )
}
