import { useState, useEffect } from 'react'
import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning, Wind, MapPin, Loader2 } from 'lucide-react'

interface WeatherData {
  temp: number
  condition: string
  city: string
  icon: string
}

const weatherIcons: Record<string, React.ElementType> = {
  'clear': Sun,
  'sunny': Sun,
  'clouds': Cloud,
  'cloudy': Cloud,
  'overcast': Cloud,
  'rain': CloudRain,
  'drizzle': CloudRain,
  'snow': CloudSnow,
  'thunderstorm': CloudLightning,
  'wind': Wind,
}

const defaultCities = [
  { name: '深圳', lat: 22.5431, lon: 114.0579 },
  { name: '北京', lat: 39.9042, lon: 116.4074 },
  { name: '上海', lat: 31.2304, lon: 121.4737 },
  { name: '广州', lat: 23.1291, lon: 113.2644 },
]

// 请替换为你的高德地图 API 密钥（申请地址：https://lbs.amap.com/）
const GAODE_MAP_API_KEY = '81cd5bfa7b57ca86f83b185463b7a4b4'

// 后备方案：根据经纬度粗略判断城市（当高德 API 失败时使用）
const getCityByCoords = (lat: number, lon: number): string => {
  if (lat >= 22.4 && lat <= 22.8 && lon >= 113.7 && lon <= 114.6) return '深圳'
  if (lat >= 22.9 && lat <= 23.4 && lon >= 113.0 && lon <= 113.7) return '广州'
  if (lat >= 30.7 && lat <= 31.5 && lon >= 121.0 && lon <= 122.0) return '上海'
  if (lat >= 39.4 && lat <= 40.2 && lon >= 115.7 && lon <= 117.0) return '北京'
  if (lat >= 29.8 && lat <= 30.5 && lon >= 119.8 && lon <= 120.5) return '杭州'
  if (lat >= 30.4 && lat <= 31.0 && lon >= 103.5 && lon <= 104.5) return '成都'
  if (lat >= 30.3 && lat <= 30.8 && lon >= 114.0 && lon <= 114.6) return '武汉'
  if (lat >= 31.8 && lat <= 32.3 && lon >= 118.5 && lon <= 119.2) return '南京'
  if (lat >= 33.9 && lat <= 34.5 && lon >= 108.7 && lon <= 109.3) return '西安'
  if (lat >= 29.3 && lat <= 29.9 && lon >= 106.2 && lon <= 106.8) return '重庆'
  if (lat >= 38.8 && lat <= 39.5 && lon >= 116.8 && lon <= 117.8) return '天津'
  if (lat >= 31.0 && lat <= 31.5 && lon >= 120.3 && lon <= 121.0) return '苏州'
  if (lat >= 22.6 && lat <= 23.1 && lon >= 113.5 && lon <= 114.2) return '东莞'
  if (lat >= 22.8 && lat <= 23.2 && lon >= 112.8 && lon <= 113.3) return '佛山'
  if (lat >= 22.0 && lat <= 22.5 && lon >= 113.3 && lon <= 113.8) return '珠海'
  return '当前位置'
}

// 使用高德地图逆地理编码 API 获取城市名
const reverseGeocodeWithGaode = async (lat: number, lon: number): Promise<string> => {
  try {
    // 高德逆地理编码 API：设置 coordsys=gps 以直接传入 WGS84 坐标（浏览器获取的坐标）
    const url = `https://restapi.amap.com/v3/geocode/regeo?output=json&location=${lon},${lat}&key=${GAODE_MAP_API_KEY}&radius=1000&extensions=all&coordsys=gps`

    const response = await fetch(url)
    if (!response.ok) throw new Error('Gaode API request failed')

    const data = await response.json()
    if (data.status !== '1' || !data.regeocode) {
      throw new Error(`Gaode API error: ${data.info || '未知错误'}`)
    }

    // 提取城市信息：优先使用 addressComponent.city，如果没有则使用 province
    const addressComponent = data.regeocode.addressComponent
    const city = addressComponent?.city || addressComponent?.province || ''
    
    // 如果城市为空，返回后备判断结果
    return city || getCityByCoords(lat, lon)
  } catch (error) {
    console.warn('高德逆地理编码失败，回退到坐标匹配', error)
    return getCityByCoords(lat, lon)
  }
}

export default function Weather() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchWeather = async (lat: number, lon: number, cityName?: string) => {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`
        )
        if (!res.ok) throw new Error('Weather API failed')
        
        const data = await res.json()
        const temp = Math.round(data.current.temperature_2m)
        const code = data.current.weather_code

        let condition = '晴'
        let icon = 'sunny'
        if (code === 0) { condition = '晴'; icon = 'sunny' }
        else if (code <= 3) { condition = '多云'; icon = 'clouds' }
        else if (code <= 49) { condition = '雾'; icon = 'cloudy' }
        else if (code <= 69) { condition = '雨'; icon = 'rain' }
        else if (code <= 79) { condition = '雪'; icon = 'snow' }
        else if (code <= 99) { condition = '雷雨'; icon = 'thunderstorm' }

        // 如果没有传入城市名，则通过高德 API 获取
        const city = cityName || await reverseGeocodeWithGaode(lat, lon)
        setWeather({ temp, condition, city, icon })
        setError(false)
      } catch {
        setError(true)
        setWeather(null)
      } finally {
        setLoading(false)
      }
    }

    const getLocationAndWeather = async () => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords
            await fetchWeather(latitude, longitude)
          },
          async () => {
            // 定位失败时使用默认城市（如深圳），并添加标记
            const defaultCity = defaultCities[0]
            await fetchWeather(defaultCity.lat, defaultCity.lon, defaultCity.name + '（默认）')
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
        )
      } else {
        // 浏览器不支持定位，使用默认城市
        const defaultCity = defaultCities[0]
        await fetchWeather(defaultCity.lat, defaultCity.lon, defaultCity.name + '（默认）')
      }
    }

    getLocationAndWeather()
    
    const interval = setInterval(getLocationAndWeather, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-stone-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">获取天气...</span>
      </div>
    )
  }

  if (error || !weather) {
    return (
      <div className="flex items-center gap-2 text-stone-400">
        <Cloud className="w-4 h-4" />
        <span className="text-sm">天气暂不可用</span>
      </div>
    )
  }

  const WeatherIcon = weatherIcons[weather.icon] || Cloud

  return (
    <div className="flex items-center gap-3 text-stone-600">
      <div className="flex items-center gap-1.5">
        <MapPin className="w-3.5 h-3.5 text-terracotta-500" />
        <span className="text-sm">{weather.city}</span>
      </div>
      <div className="flex items-center gap-2 px-3 py-1.5 bg-terracotta-50 rounded-xl">
        <WeatherIcon className="w-4 h-4 text-terracotta-600" />
        <span className="text-sm font-medium text-terracotta-700">{weather.condition}</span>
        <span className="text-sm font-semibold text-terracotta-800">{weather.temp}°C</span>
      </div>
    </div>
  )
}
