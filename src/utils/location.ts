// src/utils/location.ts

/**
 * 获取浏览器定位或 IP 定位的经纬度
 */
const getCurrentCoords = (): Promise<{ lat: number; lon: number }> => {
  return new Promise((resolve, reject) => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        async (err) => {
          console.warn('浏览器定位失败，尝试 IP 定位', err);
          const ipLoc = await getLocationByIP();
          if (ipLoc) {
            resolve({ lat: ipLoc.lat, lon: ipLoc.lon });
          } else {
            reject(new Error('无法获取位置，请手动输入'));
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      // 浏览器不支持定位，直接尝试 IP
      getLocationByIP().then(ipLoc => {
        if (ipLoc) resolve({ lat: ipLoc.lat, lon: ipLoc.lon });
        else reject(new Error('浏览器不支持定位'));
      });
    }
  });
};

/**
 * 获取地理位置信息（包含城市名、经纬度、时间戳），并自动保存到 storage
 */
export const getGeolocation = async (): Promise<{ name: string; lat: number; lon: number; timestamp: number } | null> => {
  try {
    const { lat, lon } = await getCurrentCoords();
    const name = await reverseGeocodeWithNominatim(lat, lon);
    const location = { name, lat, lon, timestamp: Date.now() };
    saveLocationToStorage(location);
    return location;
  } catch (error) {
    console.error('获取地理位置失败', error);
    return null;
  }
};

/**
 * 保存位置信息到 localStorage
 */
export const saveLocationToStorage = (location: { name: string; lat: number; lon: number; timestamp: number }) => {
  localStorage.setItem('lastLocation', JSON.stringify(location));
};

/**
 * 从 localStorage 读取上次保存的位置
 */
export const getLocationFromStorage = (): { name: string; lat: number; lon: number; timestamp: number } | null => {
  const stored = localStorage.getItem('lastLocation');
  return stored ? JSON.parse(stored) : null;
};

/**
 * 使用 OpenStreetMap Nominatim 进行反向地理编码（经纬度 → 地点名称）
 */
export const reverseGeocodeWithNominatim = async (lat: number, lon: number): Promise<string> => {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`;
    const response = await fetch(url, {
      headers: {
        // 请替换为你的应用名称和联系方式（必须设置，否则可能被限流）
        'User-Agent': 'MyApp/1.0 (your-email@example.com)'
      }
    });
    if (!response.ok) throw new Error('Nominatim API failed');
    const data = await response.json();
    const addr = data.address;
    return addr.city || addr.town || addr.village || addr.county || addr.state || addr.country || '当前位置';
  } catch (error) {
    console.warn('Nominatim 逆地理编码失败', error);
    return '当前位置';
  }
};

/**
 * 使用 HTTPS 的 IP 定位（免费、支持浏览器跨域）：先 ipwho.is（实测返回
 * Access-Control-Allow-Origin: *），再 ipapi.co（免费额度按客户端 IP 计，
 * 共享出口 IP 可能被限流，只作备用）。
 * 注意：旧代码用的 http://ip-api.com 在 HTTPS 站点上会被浏览器作为混合内容
 * 直接拦截，实际上从未生效，故不再使用。
 * 返回城市名、纬度、经度，若失败返回 null
 */
export const getLocationByIP = async (): Promise<{ city: string; lat: number; lon: number } | null> => {
  const withTimeout = <T,>(p: Promise<T>, ms: number): Promise<T> =>
    Promise.race([
      p,
      new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
    ])

  const attempts: Array<() => Promise<{ city: string; lat: number; lon: number } | null>> = [
    async () => {
      const response = await withTimeout(fetch('https://ipwho.is/'), 3000)
      if (!response.ok) return null
      const data = await response.json()
      if (!data.success || typeof data.latitude !== 'number' || typeof data.longitude !== 'number') return null
      return { city: data.city || '', lat: data.latitude, lon: data.longitude }
    },
    async () => {
      const response = await withTimeout(fetch('https://ipapi.co/json/'), 3000)
      if (!response.ok) return null
      const data = await response.json()
      if (data.error || typeof data.latitude !== 'number' || typeof data.longitude !== 'number') return null
      return { city: data.city || '', lat: data.latitude, lon: data.longitude }
    },
  ]

  for (const fn of attempts) {
    try {
      const result = await fn()
      if (result) return result
    } catch {
      // 换下一个
    }
  }
  return null
};
