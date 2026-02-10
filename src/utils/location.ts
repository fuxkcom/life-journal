// src/utils/location.ts

/**
 * 反向地理编码：将经纬度转换为城市名称
 */
export const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  try {
    // 使用本地城市坐标匹配
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
      // 计算近似距离
      const dLat = (lat - city.lat) * 111.32
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

/**
 * 获取地理位置
 */
export const getGeolocation = async (): Promise<{
  lat: number
  lng: number
  name: string
  timestamp: number
} | null> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.warn('浏览器不支持地理位置功能')
      resolve(null)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords
          const cityName = await reverseGeocode(latitude, longitude)
          
          const locationData = {
            lat: latitude,
            lng: longitude,
            name: cityName,
            timestamp: Date.now()
          }
          
          resolve(locationData)
        } catch (error) {
          console.error('获取地理位置失败:', error)
          resolve(null)
        }
      },
      (error) => {
        console.error('地理位置错误:', error)
        resolve(null)
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000
      }
    )
  })
}

/**
 * 保存位置到本地存储
 */
export const saveLocationToStorage = (location: {
  lat: number
  lng: number
  name: string
  timestamp: number
}) => {
  try {
    localStorage.setItem('sharedLocation', JSON.stringify(location))
    return true
  } catch (error) {
    console.error('保存位置失败:', error)
    return false
  }
}

/**
 * 从本地存储获取位置
 */
export const getLocationFromStorage = (): {
  lat: number
  lng: number
  name: string
  timestamp: number
} | null => {
  try {
    const stored = localStorage.getItem('sharedLocation')
    if (!stored) return null
    
    const location = JSON.parse(stored)
    
    // 检查位置是否在1小时内（可调整时间）
    if (Date.now() - location.timestamp < 60 * 60 * 1000) {
      return location
    }
    
    return null
  } catch (error) {
    console.error('读取位置失败:', error)
    return null
  }
}
