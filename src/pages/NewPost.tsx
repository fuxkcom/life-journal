import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { ArrowLeft, Image, X, Send, Loader2, MapPin, MapPinOff } from 'lucide-react'

export default function NewPost() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [content, setContent] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showLocation, setShowLocation] = useState(true)
  const [location, setLocation] = useState<{ lat: number; lng: number; name: string } | null>(null)
  const [loadingLocation, setLoadingLocation] = useState(false)
  const [locationError, setLocationError] = useState(false)
  const [manualLocation, setManualLocation] = useState('')
  const [showManualInput, setShowManualInput] = useState(false)

  useEffect(() => {
    if (showLocation) {
      getLocation()
    }
  }, [])

  const getLocation = async () => {
    if (!navigator.geolocation) {
      setLocationError(true)
      return
    }
    setLoadingLocation(true)
    setLocationError(false)
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000, enableHighAccuracy: false })
      })
      const { latitude, longitude } = position.coords
      const cityName = await reverseGeocode(latitude, longitude)
      setLocation({ lat: latitude, lng: longitude, name: cityName })
    } catch (e) {
      setLocationError(true)
      setLocation(null)
    } finally {
      setLoadingLocation(false)
    }
  }

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    // 使用本地城市坐标匹配，避免海外API访问问题
    const cities = [
      { name: '深圳', lat: 22.54, lng: 114.06, range: 0.5 },
      { name: '广州', lat: 23.13, lng: 113.26, range: 0.5 },
      { name: '北京', lat: 39.90, lng: 116.41, range: 0.8 },
      { name: '上海', lat: 31.23, lng: 121.47, range: 0.6 },
      { name: '杭州', lat: 30.27, lng: 120.15, range: 0.5 },
      { name: '成都', lat: 30.57, lng: 104.07, range: 0.5 },
      { name: '武汉', lat: 30.59, lng: 114.31, range: 0.5 },
      { name: '南京', lat: 32.06, lng: 118.80, range: 0.5 },
      { name: '西安', lat: 34.27, lng: 108.95, range: 0.5 },
      { name: '重庆', lat: 29.56, lng: 106.55, range: 0.6 },
      { name: '天津', lat: 39.13, lng: 117.20, range: 0.5 },
      { name: '苏州', lat: 31.30, lng: 120.62, range: 0.4 },
      { name: '东莞', lat: 23.02, lng: 113.75, range: 0.4 },
      { name: '佛山', lat: 23.02, lng: 113.12, range: 0.4 },
      { name: '珠海', lat: 22.27, lng: 113.58, range: 0.3 },
      { name: '厦门', lat: 24.48, lng: 118.09, range: 0.4 },
      { name: '长沙', lat: 28.23, lng: 112.94, range: 0.5 },
      { name: '青岛', lat: 36.07, lng: 120.38, range: 0.5 },
      { name: '郑州', lat: 34.75, lng: 113.63, range: 0.5 },
      { name: '沈阳', lat: 41.80, lng: 123.43, range: 0.5 },
      { name: '大连', lat: 38.91, lng: 121.60, range: 0.4 },
      { name: '济南', lat: 36.65, lng: 117.00, range: 0.5 },
      { name: '合肥', lat: 31.82, lng: 117.23, range: 0.5 },
      { name: '福州', lat: 26.07, lng: 119.30, range: 0.5 },
      { name: '昆明', lat: 24.88, lng: 102.83, range: 0.5 },
      { name: '南宁', lat: 22.82, lng: 108.32, range: 0.5 },
      { name: '贵阳', lat: 26.65, lng: 106.63, range: 0.5 },
      { name: '哈尔滨', lat: 45.80, lng: 126.53, range: 0.6 },
      { name: '长春', lat: 43.90, lng: 125.32, range: 0.5 },
      { name: '石家庄', lat: 38.04, lng: 114.50, range: 0.5 },
      { name: '无锡', lat: 31.57, lng: 120.30, range: 0.4 },
      { name: '宁波', lat: 29.87, lng: 121.55, range: 0.4 },
      { name: '温州', lat: 28.00, lng: 120.70, range: 0.4 },
      { name: '南昌', lat: 28.68, lng: 115.86, range: 0.5 },
      { name: '海口', lat: 20.04, lng: 110.32, range: 0.4 },
      { name: '三亚', lat: 18.25, lng: 109.50, range: 0.3 },
    ]
    
    for (const city of cities) {
      const distance = Math.sqrt(Math.pow(lat - city.lat, 2) + Math.pow(lng - city.lng, 2))
      if (distance < city.range) {
        return city.name
      }
    }
    return '当前位置'
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length + images.length > 9) {
      alert('最多上传9张图片')
      return
    }
    
    setImages([...images, ...files])
    files.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviews(prev => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
    setPreviews(previews.filter((_, i) => i !== index))
  }

  const uploadImages = async (): Promise<string[]> => {
    const urls: string[] = []
    for (const file of images) {
      const fileName = `${user?.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${file.name.split('.').pop()}`
      const { data, error } = await supabase.storage.from('posts').upload(fileName, file)
      if (!error && data) {
        const { data: urlData } = supabase.storage.from('posts').getPublicUrl(data.path)
        urls.push(urlData.publicUrl)
      }
    }
    return urls
  }

  const handleSubmit = async () => {
    if (!content.trim() && images.length === 0) return
    if (!user) return

    setLoading(true)
    try {
      let imageUrls: string[] = []
      if (images.length > 0) {
        imageUrls = await uploadImages()
      }

      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        content: content.trim(),
        image_urls: imageUrls.length > 0 ? imageUrls : null,
        visibility: 'friends',
        latitude: showLocation && location ? location.lat : null,
        longitude: showLocation && location ? location.lng : null,
        location_name: showLocation && location ? location.name : null,
        show_location: showLocation
      })

      if (!error) {
        navigate('/')
      } else {
        alert('发布失败: ' + error.message)
      }
    } catch (e) {
      alert('发布失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="font-semibold text-lg">发布动态</h1>
          <button
            onClick={handleSubmit}
            disabled={loading || (!content.trim() && images.length === 0)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-full font-medium disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            发布
          </button>
        </div>
      </header>

      <main className="pt-16 pb-24 p-4">
        <div className="max-w-2xl mx-auto">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="分享你的生活..."
            className="w-full min-h-[200px] p-4 text-lg bg-white rounded-xl border-0 focus:ring-0 resize-none"
            autoFocus
          />

          {/* Image Previews */}
          {previews.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-2">
              {previews.map((preview, index) => (
                <div key={index} className="relative aspect-square">
                  <img src={preview} alt="" className="w-full h-full object-cover rounded-xl" />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add Image Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 flex items-center gap-2 px-4 py-3 bg-white rounded-xl text-gray-600 hover:bg-gray-50"
          >
            <Image className="w-5 h-5" />
            <span>添加图片</span>
            <span className="text-sm text-gray-400">({previews.length}/9)</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageSelect}
            className="hidden"
          />

          {/* 位置选项 */}
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => {
                  if (locationError && showLocation) {
                    getLocation()
                  } else {
                    setShowLocation(!showLocation)
                    if (!showLocation && !location) getLocation()
                  }
                }}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-colors ${
                  showLocation 
                    ? locationError 
                      ? 'bg-red-50 text-red-500' 
                      : 'bg-green-50 text-green-600' 
                  : 'bg-white text-gray-400'
                }`}
              >
                {loadingLocation ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : showLocation ? (
                  <MapPin className="w-5 h-5" />
                ) : (
                  <MapPinOff className="w-5 h-5" />
                )}
                <span>
                  {loadingLocation 
                    ? '获取位置中...' 
                    : locationError && showLocation
                      ? '获取失败，点击重试'
                      : showLocation && location 
                        ? location.name 
                        : '不显示位置'}
                </span>
              </button>
              {showLocation && (
                <button
                  onClick={() => setShowManualInput(!showManualInput)}
                  className="px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                >
                  {showManualInput ? '取消' : '手动输入'}
                </button>
              )}
              {showLocation && location && (
                <button
                  onClick={() => setShowLocation(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {/* 手动输入位置 */}
            {showManualInput && showLocation && (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={manualLocation}
                  onChange={(e) => setManualLocation(e.target.value)}
                  placeholder="输入城市名称，如：北京、上海..."
                  className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                />
                <button
                  onClick={() => {
                    if (manualLocation.trim()) {
                      setLocation({ lat: 0, lng: 0, name: manualLocation.trim() })
                      setLocationError(false)
                      setShowManualInput(false)
                      setManualLocation('')
                    }
                  }}
                  disabled={!manualLocation.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm disabled:opacity-50"
                >
                  确定
                </button>
              </div>
            )}
            {locationError && showLocation && !showManualInput && (
              <p className="text-xs text-gray-500 px-1">提示：请确保已授权位置权限，或点击"手动输入"填写位置</p>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
