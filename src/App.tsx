import { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'

// 路由懒加载：每个页面单独打包，首屏只下载当前页面需要的代码，
// 而不是把登录、聊天、发帖等全部页面打进一个 JS 文件。
const Landing = lazy(() => import('./pages/Landing'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const Home = lazy(() => import('./pages/Home'))
const NewPost = lazy(() => import('./pages/NewPost'))
const Friends = lazy(() => import('./pages/Friends'))
const Chat = lazy(() => import('./pages/Chat'))
const Profile = lazy(() => import('./pages/Profile'))
const Invite = lazy(() => import('./pages/Invite'))
const Terms = lazy(() => import('./pages/Terms'))
const Privacy = lazy(() => import('./pages/Privacy'))
const NotFound = lazy(() => import('./pages/NotFound'))

// 各公开页面的独立标题：路由变化时同步更新 document.title，
// 避免所有页面共用同一个标题（不利于 SEO 与浏览器标签页识别）。
const PAGE_TITLES: Record<string, string> = {
  '/welcome': '拾忆人生 - 记录美好生活',
  '/login': '登录 - 拾忆人生',
  '/register': '注册 - 拾忆人生',
  '/forgot-password': '找回密码 - 拾忆人生',
  '/reset-password': '重置密码 - 拾忆人生',
  '/terms': '服务条款 - 拾忆人生',
  '/privacy': '隐私政策 - 拾忆人生',
}

function usePageTitle() {
  const { pathname } = useLocation()
  useEffect(() => {
    document.title = PAGE_TITLES[pathname] ?? '拾忆人生 - 记录美好生活'
  }, [pathname])
}

// 轻量加载指示：只在屏幕中央显示一个小转圈，不再铺满全屏白底，
// 避免路由切换 / 鉴权等待时出现大面积白屏闪烁。
function PageLoader() {
  return (
    <div className="flex items-center justify-center py-24" role="status" aria-label="加载中">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-terracotta-500"></div>
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <PageLoader />
  }

  return user ? <>{children}</> : <Navigate to="/welcome" />
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <PageLoader />
  }

  return user ? <Navigate to="/" /> : <>{children}</>
}

function LandingRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <PageLoader />
  }

  return user ? <Navigate to="/" /> : <>{children}</>
}

function AppRoutes() {
  usePageTitle()
  return (
    <Routes>
      <Route path="/welcome" element={<LandingRoute><Landing /></LandingRoute>} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/invite/:userId" element={<Invite />} />
      <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/new-post" element={<ProtectedRoute><NewPost /></ProtectedRoute>} />
      <Route path="/friends" element={<ProtectedRoute><Friends /></ProtectedRoute>} />
      <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      {/* /settings 没有独立设置页，重定向到个人资料页（设置入口都在该页），
          避免直接访问 /settings 落到站内 404 */}
      <Route path="/settings" element={<ProtectedRoute><Navigate to="/profile" replace /></ProtectedRoute>} />
      {/* 未知路由：站内 404 页（带返回首页按钮），不再渲染空白页 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
          <AppRoutes />
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
