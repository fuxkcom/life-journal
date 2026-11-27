import { Link } from 'react-router-dom'
import { BookOpen, Home, SearchX } from 'lucide-react'

// 站内 404 页：任何未匹配的路由都落到这里，不再渲染空白页。
// 注意：直接访问子路径时先由 GitHub Pages 的 404.html 回退到应用入口，
// 再由本页接管展示；线上生效的前提是 404.html 已随部署发布（见 vite.config.ts）。
export default function NotFound() {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <Link to="/welcome" className="inline-flex items-center gap-2 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-terracotta-400 to-terracotta-600 rounded-xl flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-stone-800 text-xl">拾忆人生</span>
        </Link>

        <div className="bg-white rounded-3xl shadow-soft p-10">
          <SearchX className="w-12 h-12 text-terracotta-400 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-stone-900 mb-3">页面不存在</h1>
          <p className="text-stone-500 mb-8 leading-relaxed">
            抱歉，你访问的页面不存在或已被移动。
            <br />
            请检查地址是否正确，或返回首页继续记录生活。
          </p>
          <Link
            to="/welcome"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-2xl font-medium transition-all duration-300 hover:shadow-soft"
          >
            <Home className="w-5 h-5" />
            返回首页
          </Link>
        </div>
      </div>
    </div>
  )
}
