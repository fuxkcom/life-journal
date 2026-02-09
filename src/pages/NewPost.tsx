import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { ArrowLeft, Image, X, Send, Loader2, MapPin, MapPinOff, AlertCircle, Globe, Building2, Compass, Navigation } from 'lucide-react'

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
  const [locationError, setLocationError] = useState<string | null>(null)
  const [manualLocation, setManualLocation] = useState('')
  const [showManualInput, setShowManualInput] = useState(false)
  const [permissionStatus, setPermissionStatus] = useState<PermissionState | null>(null)

  // 检查地理位置权限状态
  useEffect(() => {
    checkGeolocationPermission()
  }, [])

  // 监听位置权限变化
  useEffect(() => {
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' as PermissionName })
        .then(permissionStatus => {
          permissionStatus.onchange = () => {
            setPermissionStatus(permissionStatus.state)
          }
        })
    }
  }, [])

  // 检查地理位置权限
  const checkGeolocationPermission = async () => {
    if ('permissions' in navigator) {
      try {
        const permissionStatus = await navigator.permissions.query({ 
          name: 'geolocation' as PermissionName 
        })
        setPermissionStatus(permissionStatus.state)
        return permissionStatus.state
      } catch (error) {
        console.warn('无法检查权限状态:', error)
        return null
      }
    }
    return null
  }

  // 请求地理位置权限
  const requestGeolocationPermission = async (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(false)
        return
      }

      navigator.geolocation.getCurrentPosition(
        () => {
          // 成功获取位置，说明有权限
          setPermissionStatus('granted')
          resolve(true)
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            setPermissionStatus('denied')
          }
          resolve(false)
        },
        { maximumAge: 0, timeout: 100 }
      )
    })
  }

  useEffect(() => {
    if (showLocation) {
      getLocation()
    }
  }, [showLocation])

  const getLocation = async () => {
    if (!navigator.geolocation) {
      setLocationError('您的浏览器不支持地理位置功能')
      return
    }

    // 检查权限状态
    const permission = await checkGeolocationPermission()
    
    // 如果权限被拒绝，提示用户手动输入
    if (permission === 'denied') {
      setLocationError('位置权限被拒绝，请在浏览器设置中启用位置权限，或手动输入位置')
      setShowManualInput(true)
      return
    }

    setLoadingLocation(true)
    setLocationError(null)

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        // 先尝试快速获取（使用缓存，不要求高精度）
        navigator.geolocation.getCurrentPosition(
          resolve,
          (error) => {
            // 如果快速获取失败，尝试高精度获取
            console.log('快速获取失败，尝试高精度获取:', error.message)
            navigator.geolocation.getCurrentPosition(
              resolve,
              (highAccuracyError) => {
                console.log('高精度获取失败:', highAccuracyError.message)
                let errorMessage = '无法获取您的位置'
                
                switch (highAccuracyError.code) {
                  case highAccuracyError.PERMISSION_DENIED:
                    errorMessage = '位置权限被拒绝，请在浏览器设置中启用位置权限'
                    setPermissionStatus('denied')
                    break
                  case highAccuracyError.POSITION_UNAVAILABLE:
                    errorMessage = '位置信息不可用，请检查设备定位功能'
                    break
                  case highAccuracyError.TIMEOUT:
                    errorMessage = '获取位置超时，请检查网络连接'
                    break
                }
                reject(new Error(errorMessage))
              },
              {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
              }
            )
          },
          {
            enableHighAccuracy: false,
            timeout: 5000,
            maximumAge: 60000 // 使用1分钟内的缓存位置
          }
        )
      })

      const { latitude, longitude } = position.coords
      
      // 验证坐标有效性
      if (isNaN(latitude) || isNaN(longitude) || latitude === 0 || longitude === 0) {
        throw new Error('获取到无效的位置坐标')
      }

      // 获取城市名称
      const cityName = await reverseGeocode(latitude, longitude)
      setLocation({ lat: latitude, lng: longitude, name: cityName })
      
    } catch (error: any) {
      console.error('获取位置失败:', error)
      const errorMessage = error.message || '获取位置失败'
      setLocationError(errorMessage)
      
      // 如果获取失败，自动显示手动输入选项
      if (!showManualInput) {
        setShowManualInput(true)
      }
    } finally {
      setLoadingLocation(false)
    }
  }

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      // 尝试使用浏览器内置的地理编码API（如果可用）
      if ('geocoder' in window) {
        try {
          const geocoder = new (window as any).Geocoder()
          const result = await new Promise<any>((resolve, reject) => {
            geocoder.geocode({ location: { lat, lng } }, (results: any[], status: string) => {
              if (status === 'OK' && results[0]) {
                resolve(results[0])
              } else {
                reject(new Error('地理编码失败'))
              }
            })
          })
          
          // 从结果中提取城市信息
          for (const component of result.address_components) {
            if (component.types.includes('locality') || component.types.includes('administrative_area_level_1')) {
              return component.long_name
            }
          }
        } catch (geocodeError) {
          console.warn('浏览器地理编码失败，使用备用方案:', geocodeError)
        }
      }

      // 备用方案：使用本地城市数据库
      const cities = [
        { name: '深圳', lat: 22.54, lng: 114.06, range: 0.3 },
        { name: '广州', lat: 23.13, lng: 113.26, range: 0.3 },
        { name: '北京', lat: 39.90, lng: 116.41, range: 0.4 },
        { name: '上海', lat: 31.23, lng: 121.47, range: 0.4 },
        { name: '杭州', lat: 30.27, lng: 120.15, range: 0.3 },
        { name: '成都', lat: 30.57, lng: 104.07, range: 0.4 },
        { name: '武汉', lat: 30.59, lng: 114.31, range: 0.3 },
        { name: '南京', lat: 32.06, lng: 118.80, range: 0.3 },
        { name: '西安', lat: 34.27, lng: 108.95, range: 0.4 },
        { name: '重庆', lat: 29.56, lng: 106.55, range: 0.5 },
        { name: '天津', lat: 39.13, lng: 117.20, range: 0.3 },
        { name: '苏州', lat: 31.30, lng: 120.62, range: 0.2 },
        { name: '东莞', lat: 23.02, lng: 113.75, range: 0.2 },
        { name: '佛山', lat: 23.02, lng: 113.12, range: 0.2 },
        { name: '珠海', lat: 22.27, lng: 113.58, range: 0.2 },
        { name: '厦门', lat: 24.48, lng: 118.09, range: 0.2 },
        { name: '长沙', lat: 28.23, lng: 112.94, range: 0.3 },
        { name: '青岛', lat: 36.07, lng: 120.38, range: 0.3 },
        { name: '郑州', lat: 34.75, lng: 113.63, range: 0.3 },
        { name: '沈阳', lat: 41.80, lng: 123.43, range: 0.3 },
        { name: '大连', lat: 38.91, lng: 121.60, range: 0.3 },
        { name: '济南', lat: 36.65, lng: 117.00, range: 0.3 },
        { name: '合肥', lat: 31.82, lng: 117.23, range: 0.3 },
        { name: '福州', lat: 26.07, lng: 119.30, range: 0.3 },
        { name: '昆明', lat: 24.88, lng: 102.83, range: 0.3 },
        { name: '南宁', lat: 22.82, lng: 108.32, range: 0.3 },
        { name: '贵阳', lat: 26.65, lng: 106.63, range: 0.3 },
        { name: '哈尔滨', lat: 45.80, lng: 126.53, range: 0.4 },
        { name: '长春', lat: 43.90, lng: 125.32, range: 0.3 },
        { name: '石家庄', lat: 38.04, lng: 114.50, range: 0.3 },
        { name: '无锡', lat: 31.57, lng: 120.30, range: 0.2 },
        { name: '宁波', lat: 29.87, lng: 121.55, range: 0.2 },
        { name: '温州', lat: 28.00, lng: 120.70, range: 0.2 },
        { name: '南昌', lat: 28.68, lng: 115.86, range: 0.3 },
        { name: '海口', lat: 20.04, lng: 110.32, range: 0.2 },
        { name: '三亚', lat: 18.25, lng: 109.50, range: 0.2 },
      ]
      
      // 查找最近的城市
      let closestCity = '当前位置'
      let minDistance = Infinity
      
      for (const city of cities) {
        // 计算近似距离（简化版）
        const dLat = (lat - city.lat) * 111.32 // 1度纬度约111.32公里
        const dLng = (lng - city.lng) * 111.32 * Math.cos(city.lat * Math.PI / 180)
        const distance = Math.sqrt(dLat * dLat + dLng * dLng)
        
        if (distance < city.range && distance < minDistance) {
          minDistance = distance
          closestCity = city.name
        }
      }
      
      return closestCity
      
    } catch (error) {
      console.error('反向地理编码失败:', error)
      return '当前位置'
    }
  }

  // 处理打开位置设置
  const handleOpenLocationSettings = () => {
    // 尝试打开位置设置页面（移动端友好）
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    
    if (isMobile) {
      // 移动设备通常可以通过特定链接打开设置
      alert('请在手机设置中打开位置权限：\n1. 打开手机设置\n2. 找到浏览器应用\n3. 打开位置权限')
    } else {
      // 桌面浏览器
      alert('请在浏览器设置中启用位置权限：\n1. 点击浏览器地址栏左侧的锁图标或信息图标\n2. 找到"位置"设置\n3. 选择"允许"')
    }
    
    // 提供手动输入的备选方案
    setShowManualInput(true)
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

      // 确定最终的位置名称
      let finalLocationName = null
      if (showLocation) {
        if (manualLocation.trim()) {
          finalLocationName = manualLocation.trim()
        } else if (location) {
          finalLocationName = location.name
        }
      }

      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        content: content.trim(),
        image_urls: imageUrls.length > 0 ? imageUrls : null,
        visibility: 'friends',
        latitude: showLocation && location ? location.lat : null,
        longitude: showLocation && location ? location.lng : null,
        location_name: finalLocationName,
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

  // 常用城市列表
  const popularCities = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '南京', '西安', '重庆']

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
            className="mt-4 w-full flex items-center gap-2 px-4 py-3 bg-white rounded-xl text-gray-600 hover:bg-gray-50"
          >
            <Image className="w-5 h-5" />
            <span>添加图片</span>
            <span className="text-sm text-gray-400 ml-auto">({previews.length}/9)</span>
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
          <div className="mt-6 bg-white rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-gray-500" />
                <span className="font-medium">位置</span>
              </div>
              <button
                onClick={() => {
                  if (showLocation) {
                    setShowLocation(false)
                    setShowManualInput(false)
                  } else {
                    setShowLocation(true)
                    // 如果之前没有获取过位置，立即获取
                    if (!location) {
                      getLocation()
                    }
                  }
                }}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  showLocation 
                    ? 'bg-indigo-100 text-indigo-600' 
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {showLocation ? '显示' : '不显示'}
              </button>
            </div>

            {showLocation && (
              <div className="space-y-3">
                {/* 自动获取的位置 */}
                {loadingLocation ? (
                  <div className="flex items-center justify-center gap-2 py-3 text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>正在获取您的位置...</span>
                  </div>
                ) : location && !locationError ? (
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-green-600" />
                      <span className="text-green-700 font-medium">{location.name}</span>
                      {location.name !== '当前位置' && (
                        <span className="text-xs text-green-500 bg-green-100 px-2 py-0.5 rounded-full">
                          自动获取
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setShowManualInput(true)
                          setManualLocation(location.name)
                        }}
                        className="text-sm text-gray-500 hover:text-gray-700"
                      >
                        修改
                      </button>
                      <button
                        onClick={getLocation}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="刷新位置"
                      >
                        <Navigation className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : null}

                {/* 权限被拒绝的提示 */}
                {permissionStatus === 'denied' && !location && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-amber-800 mb-2">
                          位置权限被拒绝
                        </p>
                        <p className="text-sm text-amber-700 mb-3">
                          请在浏览器设置中启用位置权限，或手动输入位置。
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={handleOpenLocationSettings}
                            className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-sm hover:bg-amber-200"
                          >
                            打开位置设置
                          </button>
                          <button
                            onClick={() => setShowManualInput(true)}
                            className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
                          >
                            手动输入位置
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 错误提示 */}
                {locationError && permissionStatus !== 'denied' && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-800 mb-2">
                          获取位置失败
                        </p>
                        <p className="text-sm text-red-700 mb-3">{locationError}</p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={getLocation}
                            className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200 flex items-center gap-2"
                          >
                            <Compass className="w-3 h-3" />
                            重新获取位置
                          </button>
                          <button
                            onClick={() => setShowManualInput(true)}
                            className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
                          >
                            手动输入位置
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 手动输入位置 */}
                {showManualInput && (
                  <div className="space-y-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">手动输入位置</span>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={manualLocation}
                          onChange={(e) => setManualLocation(e.target.value)}
                          placeholder="输入地点名称，如：北京三里屯、上海外滩..."
                          className="flex-1 px-3 py-2 bg-white border border-blue-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                        />
                      </div>
                      
                      {/* 常用城市推荐 */}
                      <div>
                        <p className="text-xs text-blue-700 mb-2">常用城市：</p>
                        <div className="flex flex-wrap gap-2">
                          {popularCities.map(city => (
                            <button
                              key={city}
                              onClick={() => setManualLocation(city)}
                              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                                manualLocation === city 
                                  ? 'bg-blue-600 text-white' 
                                  : 'bg-white text-blue-700 hover:bg-blue-100 border border-blue-200'
                              }`}
                            >
                              {city}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => {
                            if (manualLocation.trim()) {
                              setLocation({ lat: 0, lng: 0, name: manualLocation.trim() })
                              setLocationError(null)
                              setShowManualInput(false)
                            }
                          }}
                          disabled={!manualLocation.trim()}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm disabled:opacity-50"
                        >
                          使用此位置
                        </button>
                        <button
                          onClick={() => {
                            setShowManualInput(false)
                            setManualLocation('')
                          }}
                          className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg font-medium text-sm hover:bg-gray-50"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 获取位置按钮（当没有位置且没有手动输入时显示） */}
                {!location && !showManualInput && !loadingLocation && !locationError && (
                  <button
                    onClick={getLocation}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 rounded-lg text-gray-600 hover:bg-gray-100 border border-gray-200"
                  >
                    <Compass className="w-5 h-5" />
                    <span>获取当前位置</span>
                  </button>
                )}

                {/* 位置提示 */}
                <div className="text-xs text-gray-500 pt-2 border-t border-gray-100 space-y-1">
                  <p className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>
                    开启位置可以让朋友看到你在哪里
                  </p>
                  <p className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>
                    位置信息仅对朋友可见
                  </p>
                  <p className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>
                    如不需要位置，可在上方关闭位置显示
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
