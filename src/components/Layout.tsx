import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Home, Users, MessageCircle, User, LogOut, Menu, X, PenSquare, BookOpen } from 'lucide-react'

export default function Layout({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/welcome')
  }

  const navItems = [
    { path: '/', icon: Home, label: '首页' },
    { path: '/friends', icon: Users, label: '好友' },
    { path: '/chat', icon: MessageCircle, label: '消息' },
    { path: '/profile', icon: User, label: '我的' },
  ]

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-64 bg-white border-r border-stone-200 z-50">
        <div className="p-6 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-terracotta-400 to-terracotta-600 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-stone-800">生活日志</h1>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 ${
                location.pathname === item.path
                  ? 'bg-terracotta-100 text-terracotta-700'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-stone-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-terracotta-100 flex items-center justify-center overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-10 h-10 object-cover" />
              ) : (
                <User className="w-5 h-5 text-terracotta-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-stone-900 truncate">{profile?.display_name || profile?.username}</p>
              <p className="text-sm text-stone-500 truncate">@{profile?.username}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-stone-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-300"
          >
            <LogOut className="w-5 h-5" />
            <span>退出登录</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-stone-200 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-terracotta-400 to-terracotta-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-lg font-bold text-stone-800">生活日志</h1>
          </div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 hover:bg-stone-100 rounded-xl transition-colors">
            {mobileMenuOpen ? <X className="w-6 h-6 text-stone-700" /> : <Menu className="w-6 h-6 text-stone-700" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <nav className="absolute top-full left-0 right-0 bg-white border-b border-stone-200 p-4 space-y-2 shadow-soft">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 ${
                  location.pathname === item.path
                    ? 'bg-terracotta-100 text-terracotta-700'
                    : 'text-stone-600'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-4 py-3 text-red-600"
            >
              <LogOut className="w-5 h-5" />
              <span>退出登录</span>
            </button>
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main className="md:ml-64 pt-16 md:pt-0 min-h-screen">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-stone-200 z-50">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center p-2 transition-colors duration-300 ${
                location.pathname === item.path ? 'text-terracotta-600' : 'text-stone-400'
              }`}
            >
              <item.icon className="w-6 h-6" />
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Floating Action Button */}
      <Link
        to="/new-post"
        className="fixed right-6 bottom-20 md:bottom-6 w-14 h-14 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-3xl shadow-soft-lg flex items-center justify-center transition-all duration-300 hover:scale-105 z-40"
      >
        <PenSquare className="w-6 h-6" />
      </Link>
    </div>
  )
}