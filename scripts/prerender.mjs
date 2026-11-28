// 构建后预渲染（prerender）：
// 把公开路由生成为各自的静态 HTML，让搜索引擎/爬虫和首屏在「不执行 JS」时也能拿到：
//   - 每页正确的 <title>、description、canonical、og:* 元数据；
//   - /welcome、/terms、/privacy 三个纯内容页的真实正文（SSR 内联进 #root）。
// /login、/register、/forgot-password 是表单页、SEO 价值低，只注入 meta，正文留给客户端渲染。
//
// 设计为「尽力而为」：即使 SSR 环节出问题，也保证每页 meta 正确、构建不失败，
// 不会因为预渲染而拖垮整次部署。
//
// 说明：本脚本复用 vite 自带的 esbuild（从 vite 的依赖关系中解析），
// 因此不需要在 package.json 里额外声明 esbuild 依赖，也不改动 pnpm-lock.yaml。
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const dist = path.join(root, 'dist')
const SITE = 'https://fuxk.indevs.in'
const DEFAULT_DESC =
  '拾忆人生是一个温馨私密的生活记录应用：用文字和图片记录日常点滴，邀请亲密好友加入圈子，一起分享生活、互相陪伴。'

const routes = [
  { path: '/welcome', page: 'Landing', title: '拾忆人生 - 记录美好生活', desc: DEFAULT_DESC, ssr: true },
  { path: '/login', page: null, title: '登录 - 拾忆人生', desc: '登录拾忆人生，继续记录与分享你的生活点滴。', ssr: false },
  { path: '/register', page: null, title: '注册 - 拾忆人生', desc: '注册拾忆人生账号，开始记录生活的每一个珍贵瞬间。', ssr: false },
  { path: '/forgot-password', page: null, title: '找回密码 - 拾忆人生', desc: '找回拾忆人生账号的登录密码。', ssr: false },
  { path: '/terms', page: 'Terms', title: '服务条款 - 拾忆人生', desc: '拾忆人生服务条款。', ssr: true },
  { path: '/privacy', page: 'Privacy', title: '隐私政策 - 拾忆人生', desc: '拾忆人生隐私政策：我们如何收集、使用与保护你的个人信息。', ssr: true },
]

const indexHtmlPath = path.join(dist, 'index.html')
if (!fs.existsSync(indexHtmlPath)) {
  console.error('[prerender] 未找到 dist/index.html，跳过预渲染（请先确保 vite build 成功）')
  process.exit(0)
}
const template = fs.readFileSync(indexHtmlPath, 'utf8')

// 复用 vite 自带的 esbuild：从 vite 包的位置解析其依赖，避免额外安装 esbuild。
function loadEsbuild() {
  try {
    const localRequire = createRequire(import.meta.url)
    const vitePath = localRequire.resolve('vite')
    return createRequire(vitePath)('esbuild')
  } catch (e) {
    console.warn('[prerender] 未能解析 esbuild（来自 vite）：', e.message)
    return null
  }
}

// ---------- 尽力而为地构建 SSR 渲染函数（esbuild + react-dom/server） ----------
let renderFn = null
const esbuild = loadEsbuild()
if (!esbuild) {
  console.warn('[prerender] 跳过 SSR，仅注入每页 meta（构建继续进行）')
} else {
  const tmpTsx = path.join(dist, '.prerender-entry.tsx')
  const outMjs = path.join(dist, '.prerender-entry.mjs')
  try {
    const abs = (rel) => JSON.stringify(path.join(root, rel))
    const entrySrc = `
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import Landing from ${abs('src/pages/Landing.tsx')}
import Terms from ${abs('src/pages/Terms.tsx')}
import Privacy from ${abs('src/pages/Privacy.tsx')}
const MAP = { '/welcome': Landing, '/terms': Terms, '/privacy': Privacy }
export function render(p) {
  const C = MAP[p]
  if (!C) return ''
  return renderToStaticMarkup(
    React.createElement(MemoryRouter, { initialEntries: [p] }, React.createElement(C))
  )
}
`
    fs.writeFileSync(tmpTsx, entrySrc)
    await esbuild.build({
      entryPoints: [tmpTsx],
      outfile: outMjs,
      bundle: true,
      platform: 'node',
      format: 'esm',
      packages: 'external',
      jsx: 'automatic',
      logLevel: 'silent',
    })
    const mod = await import(pathToFileURL(outMjs).href + '?t=' + Date.now())
    renderFn = mod.render
    console.log('[prerender] SSR 渲染器就绪')
  } catch (e) {
    console.warn('[prerender] SSR 初始化失败，将只注入每页 meta：', e.message)
  } finally {
    fs.rmSync(tmpTsx, { force: true })
    fs.rmSync(path.join(dist, '.prerender-entry.mjs'), { force: true })
  }
}

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function buildHtml(route, bodyHtml) {
  let html = template
  const url = `${SITE}${route.path}`
  const T = esc(route.title)
  const D = esc(route.desc)
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${T}</title>`)
  html = html.replace(/<meta name="description" content="[\s\S]*?"\s*\/>/, `<meta name="description" content="${D}" />`)
  html = html.replace(/<link rel="canonical" href="[^"]*"\s*\/>/, `<link rel="canonical" href="${url}" />`)
  html = html.replace(/<meta property="og:title" content="[^"]*"\s*\/>/, `<meta property="og:title" content="${T}" />`)
  html = html.replace(/<meta property="og:description" content="[^"]*"\s*\/>/, `<meta property="og:description" content="${D}" />`)
  html = html.replace(/<meta property="og:url" content="[^"]*"\s*\/>/, `<meta property="og:url" content="${url}" />`)
  html = html.replace(/<meta name="twitter:title" content="[^"]*"\s*\/>/, `<meta name="twitter:title" content="${T}" />`)
  html = html.replace(/<meta name="twitter:description" content="[^"]*"\s*\/>/, `<meta name="twitter:description" content="${D}" />`)
  if (bodyHtml) {
    html = html.replace(
      /<!--root-html-start-->[\s\S]*?<!--root-html-end-->/,
      () => `<!--root-html-start-->${bodyHtml}<!--root-html-end-->`,
    )
  }
  return html
}

let count = 0
for (const route of routes) {
  let body = ''
  if (route.ssr && renderFn) {
    try {
      body = renderFn(route.path)
    } catch (e) {
      console.warn(`[prerender] SSR 失败 ${route.path}：`, e.message)
    }
  }
  const html = buildHtml(route, body)
  const outDir = path.join(dist, route.path.replace(/^\//, ''))
  fs.mkdirSync(outDir, { recursive: true })
  fs.writeFileSync(path.join(outDir, 'index.html'), html)
  count++
  console.log(`[prerender] ${route.path.padEnd(18)} -> ${body ? 'SSR 正文' : 'meta-only'}`)
}
console.log(`[prerender] 完成，共生成 ${count} 个路由页面`)
