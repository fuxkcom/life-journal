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

// 备选：根据经纬度粗略判断城市（仅覆盖部分城市，作为反向地理编码失败时的后备）
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

// 反向地理编码：根据经纬度获取真实城市名（使用OpenStreetMap Nominatim，注意使用政策）
const reverseGeocode = async (lat: number, lon: number): Promise<string> => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`,
      {
        headers: {
          // 请替换为你的应用名称和联系方式（必须设置，否则可能被限流）
          'User-Agent': 'MyWeatherApp/1.0 (your-email@example.com)'
        }
      }
    )
    if (!res.ok) throw new Error('Reverse geocoding failed')
    const data = await res.json()
    const addr = data.address
    // 优先返回城市名，如果没有则返回乡镇/县名
    return addr.city || addr.town || addr.village || addr.county || '当前位置'
  } catch {
    // 失败时回退到硬编码范围判断
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

        const city = cityName || await reverseGeocode(lat, lon)
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
            await fetchWeather(latitude, longitude) // 定位成功，不再自动回退到默认城市
          },
          async () => {
            // 定位失败时尝试使用默认城市（如深圳）
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
