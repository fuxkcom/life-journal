// src/utils/location.ts

// 已有的函数（示例）
export const getLocationFromStorage = () => {
  // 你的原有实现，例如：
  const stored = localStorage.getItem('lastLocation')
  return stored ? JSON.parse(stored) : null
}

// 新增：OpenStreetMap Nominatim 逆地理编码
export const reverseGeocodeWithNominatim = async (lat: number, lon: number): Promise<string> => {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`
    const response = await fetch(url, {
      headers: {
        // 请替换为你的应用名称和联系方式（必须设置，否则可能被限流）
        'User-Agent': 'MyApp/1.0 (your-email@example.com)'
      }
    })
    if (!response.ok) throw new Error('Nominatim API failed')
    const data = await response.json()
    const addr = data.address
    return addr.city || addr.town || addr.village || addr.county || addr.state || addr.country || '当前位置'
  } catch (error) {
    console.warn('Nominatim 逆地理编码失败', error)
    return '当前位置'
  }
}

// 新增：IP 定位（使用 ip-api.com，注意 HTTPS 限制）
export const getLocationByIP = async (): Promise<{ city: string; lat: number; lon: number } | null> => {
  try {
    // 注意：免费版 ip-api.com 不支持 HTTPS，若网站是 HTTPS 环境会报混合内容错误。
    // 可改用付费 HTTPS 或换用其他服务，如 ipapi.co（需 key）。
    const response = await fetch('http://ip-api.com/json/?fields=status,message,city,lat,lon')
    if (!response.ok) return null
    const data = await response.json()
    if (data.status !== 'success') return null
    return {
      city: data.city,
      lat: data.lat,
      lon: data.lon,
    }
  } catch {
    return null
  }
}
