/* 最小 Service Worker：仅用于让站点可“添加到主屏幕”（PWA 安装能力）。
 * 刻意不做任何资源缓存——所有请求都走网络，确保用户始终拿到最新版本，
 * 不会出现“改了代码但看到旧缓存”的问题。
 */
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', () => {
  /* 空处理器：不拦截、不缓存，浏览器按默认网络请求处理。 */
})
