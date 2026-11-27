import { useState, useEffect } from 'react'
import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning, Wind, MapPin, Loader2 } from 'lucide-react'

interface WeatherData {
  temp: number
  condition: string
  city: string
  icon: string
  localTime?: string  // ISO 格式的本地时间，例如 "2025-02-26T10:30"
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

// 默认城市：只有前面所有定位手段都失败时才用，并明确标注“（默认）”。
const SHENZHEN = { name: '深圳', lat: 22.5431, lon: 114.0579 }

// 各步骤的超时上限：单步拖住就放弃走下一步，不让天气拖慢首屏。
const GEO_TIMEOUT_MS = 2500          // 浏览器定位
const IP_TIMEOUT_MS = 2500           // IP 定位
const WEATHER_FETCH_TIMEOUT_MS = 3000 // Open-Meteo 天气接口
const REVERSE_GEOCODE_TIMEOUT_MS = 2000 // 逆地理编码
// 天气缓存：30 分钟内复用同一份结果，避免每次进首页都重新定位、重新请求。
const CACHE_KEY = 'life-journal-weather'
const CACHE_TTL_MS = 30 * 60 * 1000
// 上次成功定位的坐标（与 Home/NewPost 共用 localStorage 的 lastLocation）：
// 24 小时内直接复用，不再重复弹定位授权，天气秒出。
const SAVED_COORDS_KEY = 'lastLocation'
const SAVED_COORDS_TTL_MS = 24 * 60 * 60 * 1000

// 后备方案：根据经纬度粗略判断中国部分城市
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

// 给单个异步步骤加超时：超时即按失败处理，走下一步。
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => window.setTimeout(() => reject(new Error('timeout')), ms)),
  ])
}

// 多个定位手段取“最先成功的那一个”：全部失败或整体超时才放弃。
// （不能用 Promise.race：某个手段先失败会直接把 race 带崩，
//   也不能用 Promise.allSettled：会等最慢的那个，白白拖满超时。）
function firstSuccess<T>(promises: Promise<T>[], timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    let pending = promises.length
    let done = false
    const timer = window.setTimeout(() => {
      if (!done) {
        done = true
        reject(new Error('timeout'))
      }
    }, timeoutMs)
    promises.forEach((p) => {
      p.then((v) => {
        if (!done) {
          done = true
          window.clearTimeout(timer)
          resolve(v)
        }
      }).catch(() => {
        pending -= 1
        if (pending === 0 && !done) {
          done = true
          window.clearTimeout(timer)
          reject(new Error('all failed'))
        }
      })
    })
  })
}

// 浏览器定位：超时未返回就放弃（注意 getCurrentPosition 本身无法取消，
// 超时后它的回调就算回来也会被忽略，不会再触发一次天气请求）。
function getBrowserCoords(): Promise<{ lat: number; lon: number }> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) return reject(new Error('no geolocation'))
    const timer = window.setTimeout(() => reject(new Error('geolocation timeout')), GEO_TIMEOUT_MS)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        window.clearTimeout(timer)
        resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude })
      },
      (err) => {
        window.clearTimeout(timer)
        reject(err)
      },
      { enableHighAccuracy: false, timeout: GEO_TIMEOUT_MS, maximumAge: 600000 }
    )
  })
}

// HTTPS 的 IP 定位（支持浏览器跨域）：先 ipwho.is（实测返回
// Access-Control-Allow-Origin: *，无需 key），再 ipapi.co（免费额度按
// 客户端 IP 计，共享出口 IP 可能被限流，只作备用）。
// 注意：旧代码用的 http://ip-api.com 在 HTTPS 站点上会被浏览器作为混合内容
// 直接拦截，实际上从未生效，故不再使用。
async function getIPLocation(): Promise<{ city: string; lat: number; lon: number } | null> {
  const attempts: Array<() => Promise<{ city: string; lat: number; lon: number } | null>> = [
    async () => {
      const res = await withTimeout(fetch('https://ipwho.is/'), IP_TIMEOUT_MS)
      if (!res.ok) return null
      const d = await res.json()
      if (!d.success || typeof d.latitude !== 'number' || typeof d.longitude !== 'number') return null
      return { city: (d.city as string) || '', lat: d.latitude, lon: d.longitude }
    },
    async () => {
      const res = await withTimeout(fetch('https://ipapi.co/json/'), IP_TIMEOUT_MS)
      if (!res.ok) return null
      const d = await res.json()
      if (d.error || typeof d.latitude !== 'number' || typeof d.longitude !== 'number') return null
      return { city: (d.city as string) || '', lat: d.latitude, lon: d.longitude }
    },
  ]
  for (const fn of attempts) {
    try {
      const r = await fn()
      if (r) return r
    } catch {
      // 换下一个
    }
  }
  return null
}

// 逆地理编码：BigDataCloud 免费客户端接口（支持 CORS、中文地名），
// 失败再试 Nominatim，最后用经纬度范围粗判。
async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const res = await withTimeout(
      fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=zh`),
      REVERSE_GEOCODE_TIMEOUT_MS
    )
    if (!res.ok) throw new Error('BigDataCloud failed')
    const d = await res.json()
    const city = (d.city as string) || (d.locality as string) || (d.principalSubdivision as string)
    if (city) return city
    throw new Error('no city')
  } catch (e) {
    console.warn('BigDataCloud 逆地理编码失败，尝试 Nominatim', e)
  }

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`
    const res = await withTimeout(
      fetch(url, { headers: { 'Accept-Language': 'zh-CN,zh;q=0.9' } }),
      REVERSE_GEOCODE_TIMEOUT_MS
    )
    if (!res.ok) throw new Error('Nominatim API failed')
    const d = await res.json()
    const addr = d.address || {}
    return addr.city || addr.town || addr.village || addr.county || addr.state || addr.country || getCityByCoords(lat, lon)
  } catch (e) {
    console.warn('Nominatim 逆地理编码失败', e)
    return getCityByCoords(lat, lon)
  }
}

const readCachedWeather = (): WeatherData | null => {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { data, savedAt } = JSON.parse(raw) as { data: WeatherData; savedAt: number }
    if (Date.now() - savedAt > CACHE_TTL_MS) return null
    return data
  } catch {
    return null
  }
}

const saveCachedWeather = (data: WeatherData) => {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, savedAt: Date.now() }))
  } catch {
    // 浏览器禁用存储时忽略，不影响天气展示
  }
}

const readSavedCoords = (): { lat: number; lon: number } | null => {
  try {
    const raw = localStorage.getItem(SAVED_COORDS_KEY)
    if (!raw) return null
    const { lat, lon, timestamp } = JSON.parse(raw)
    if (typeof lat !== 'number' || typeof lon !== 'number') return null
    if (timestamp && Date.now() - timestamp > SAVED_COORDS_TTL_MS) return null
    return { lat, lon }
  } catch {
    return null
  }
}

const saveCoords = (lat: number, lon: number) => {
  try {
    localStorage.setItem(SAVED_COORDS_KEY, JSON.stringify({ name: '', lat, lon, timestamp: Date.now() }))
  } catch {
    // 忽略存储失败
  }
}

// Open-Meteo：免费、免 key、支持浏览器跨域。单次请求 3 秒超时。
async function fetchOpenMeteo(lat: number, lon: number): Promise<Omit<WeatherData, 'city'> | null> {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), WEATHER_FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`,
      { signal: controller.signal }
    )
    if (!res.ok) throw new Error('Weather API failed')
    const data = await res.json()
    const temp = Math.round(data.current.temperature_2m)
    const code = data.current.weather_code
    const localTime = data.current.time

    let condition = '晴'
    let icon = 'sunny'
    if (code === 0) { condition = '晴'; icon = 'sunny' }
    else if (code <= 3) { condition = '多云'; icon = 'clouds' }
    else if (code <= 49) { condition = '雾'; icon = 'cloudy' }
    else if (code <= 69) { condition = '雨'; icon = 'rain' }
    else if (code <= 79) { condition = '雪'; icon = 'snow' }
    else if (code <= 99) { condition = '雷雨'; icon = 'thunderstorm' }

    return { temp, condition, icon, localTime }
  } catch (e) {
    console.warn('Open-Meteo 天气请求失败', e)
    return null
  } finally {
    window.clearTimeout(timer)
  }
}

export default function Weather() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false

    const loadWeather = async () => {
      // 先读缓存：30 分钟内直接展示，不再发请求
      const cached = readCachedWeather()
      if (cached) {
        if (cancelled) return
        setWeather(cached)
        setLoading(false)
        setError(false)
        return
      }

      // 定位链（按顺序降级，务必拿到天气）：
      // ① 上次保存的坐标（24 小时内，不再弹定位）→ ② 浏览器定位与 IP 定位
      //    同时跑，谁先成功用谁 → ③ 深圳默认坐标（标注“默认”）。
      let coords: { lat: number; lon: number } | null = readSavedCoords()
      let cityName: string | undefined

      if (!coords) {
        try {
          const located = await firstSuccess<{ lat: number; lon: number; city?: string }>([
            getBrowserCoords().then((c) => ({ ...c })),
            getIPLocation().then((ip) => {
              if (!ip) throw new Error('IP location failed')
              return { lat: ip.lat, lon: ip.lon, city: ip.city }
            }),
          ], Math.max(GEO_TIMEOUT_MS, IP_TIMEOUT_MS))
          coords = { lat: located.lat, lon: located.lon }
          cityName = located.city || undefined
        } catch {
          coords = null
        }
      }

      if (!coords) {
        coords = { lat: SHENZHEN.lat, lon: SHENZHEN.lon }
        cityName = SHENZHEN.name + '（默认）'
      }

      // 天气接口：先用定位到的坐标查；失败再用深圳默认坐标重试一次；
      // 两次都失败才显示“天气暂不可用”。
      let wx = await fetchOpenMeteo(coords.lat, coords.lon)
      if (!wx) {
        wx = await fetchOpenMeteo(SHENZHEN.lat, SHENZHEN.lon)
        if (wx) {
          coords = { lat: SHENZHEN.lat, lon: SHENZHEN.lon }
          cityName = SHENZHEN.name + '（默认）'
        }
      }

      if (cancelled) return
      if (!wx) {
        setError(true)
        setWeather(null)
        setLoading(false)
        return
      }

      // 城市名：IP 定位已给出的优先；否则逆地理编码；都不行用经纬度粗判。
      const city = cityName || (await reverseGeocode(coords.lat, coords.lon))
      const result: WeatherData = { ...wx, city }
      if (cancelled) return
      setWeather(result)
      saveCachedWeather(result)
      saveCoords(coords.lat, coords.lon)
      setError(false)
      setLoading(false)
    }

    loadWeather()

    // 每 30 分钟刷新一次：走同一流程（有缓存/已存坐标时不重复弹定位）。
    const interval = setInterval(loadWeather, 30 * 60 * 1000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
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

  // 格式化本地时间显示
  const formattedTime = weather.localTime
    ? new Date(weather.localTime).toLocaleString('zh-CN', {
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).replace(/\//g, '-') // 将日期分隔符统一为 '-'
    : ''

  return (
    <div className="flex items-center gap-3 text-stone-600">
      <div className="flex items-center gap-1.5">
        <MapPin className="w-3.5 h-3.5 text-terracotta-500" />
        <span className="text-sm">{weather.city}</span>
        {formattedTime && (
          <span className="text-xs text-stone-400 ml-1">{formattedTime}</span>
        )}
      </div>
      <div className="flex items-center gap-2 px-3 py-1.5 bg-terracotta-50 rounded-xl">
        <WeatherIcon className="w-4 h-4 text-terracotta-600" />
        <span className="text-sm font-medium text-terracotta-700">{weather.condition}</span>
        <span className="text-sm font-semibold text-terracotta-800">{weather.temp}°C</span>
      </div>
    </div>
  )
}
