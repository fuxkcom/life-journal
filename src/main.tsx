import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'

// 字体策略：使用「系统原生中文字体」（苹方 / 微软雅黑 / 宋体 / 楷体等），
// 不再请求 Google Fonts、也不额外下载网络字体：
//   - 中国大陆访问稳定，无第三方阻塞风险、不产生任何字体流量；
//   - 系统字体渲染即时（无 FOIT/FOUT），首屏更快；
//   - 苹果/安卓/Windows 上的原生中文字体本身就很耐看。
// 字体栈见 tailwind.config.js 与 src/index.css。若日后想还原 Noto Serif SC / 行书
// 的品牌字体，可自托管 @fontsource（详见 docs/fonts.md）。

import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

// 注册最小的 Service Worker（仅在生产构建启用）：让站点可“添加到主屏幕”。
// SW 采用纯网络透传、不缓存任何资源，避免出现“改了代码用户却看到旧版本”的缓存问题。
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* 注册失败不影响正常使用 */
    })
  })
}
