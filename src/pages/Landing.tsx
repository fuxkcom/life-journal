import { Link } from 'react-router-dom'
import { BookOpen, Users, MessageCircle, Sparkles, ArrowRight, Heart } from 'lucide-react'
import DateTime from '../components/DateTime'
import Weather from '../components/Weather'

export default function Landing() {
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Floating Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-4">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-soft px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-terracotta-400 to-terracotta-600 rounded-xl flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-stone-800 text-lg">生活日志</span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="px-5 py-2 text-stone-600 hover:text-terracotta-600 font-medium transition-colors duration-300"
              >
                登录
              </Link>
              <Link
                to="/register"
                className="px-5 py-2.5 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-2xl font-medium transition-all duration-300 hover:shadow-soft"
              >
                开始记录
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Date Time & Weather Info Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-8 animate-fade-up">
            <DateTime />
            <div className="hidden sm:block w-px h-6 bg-stone-200" />
            <Weather />
          </div>

          {/* Decorative Elements */}
          <div className="relative mb-8">
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-24 h-24 bg-terracotta-200/40 rounded-full blur-3xl animate-float" />
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-terracotta-100/60 text-terracotta-700 rounded-full text-sm font-medium animate-fade-up">
              <Sparkles className="w-4 h-4" />
              温暖记录每一天
            </span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-stone-900 mb-6 animate-fade-up leading-tight">
            用心记录生活
            <br />
            <span className="text-terracotta-500">与挚友分享美好</span>
          </h1>
          
          <p className="text-lg md:text-xl text-stone-500 mb-10 max-w-2xl mx-auto animate-fade-up-delay leading-relaxed">
            一个温馨私密的空间，让你自在地记录日常点滴，
            与亲密好友共同见证生活中的每一个珍贵瞬间。
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up-delay">
            <Link
              to="/register"
              className="group flex items-center gap-2 px-8 py-4 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-3xl font-semibold text-lg transition-all duration-400 hover:shadow-soft-lg hover:scale-[1.02]"
            >
              免费开始
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
            <Link
              to="/login"
              className="px-8 py-4 text-stone-600 hover:text-terracotta-600 font-medium transition-colors duration-300"
            >
              已有账号？登录
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mb-4">
              简单而温暖的功能
            </h2>
            <p className="text-stone-500 text-lg">
              专注于最重要的事情 —— 记录与分享
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="group bg-white rounded-3xl p-8 shadow-soft hover:shadow-soft-lg transition-all duration-400 hover:-translate-y-1">
              <div className="w-14 h-14 bg-terracotta-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-terracotta-200 transition-colors duration-300">
                <BookOpen className="w-7 h-7 text-terracotta-600" />
              </div>
              <h3 className="text-xl font-semibold text-stone-900 mb-3">生活记录</h3>
              <p className="text-stone-500 leading-relaxed">
                用文字和图片记录每一个值得铭记的瞬间，让美好的回忆永不褪色。
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="group bg-white rounded-3xl p-8 shadow-soft hover:shadow-soft-lg transition-all duration-400 hover:-translate-y-1">
              <div className="w-14 h-14 bg-terracotta-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-terracotta-200 transition-colors duration-300">
                <Users className="w-7 h-7 text-terracotta-600" />
              </div>
              <h3 className="text-xl font-semibold text-stone-900 mb-3">好友圈子</h3>
              <p className="text-stone-500 leading-relaxed">
                邀请亲密好友加入你的圈子，一起分享生活，互相陪伴成长。
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="group bg-white rounded-3xl p-8 shadow-soft hover:shadow-soft-lg transition-all duration-400 hover:-translate-y-1">
              <div className="w-14 h-14 bg-terracotta-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-terracotta-200 transition-colors duration-300">
                <MessageCircle className="w-7 h-7 text-terracotta-600" />
              </div>
              <h3 className="text-xl font-semibold text-stone-900 mb-3">温暖交流</h3>
              <p className="text-stone-500 leading-relaxed">
                与好友进行私密对话，分享心事，在这里找到温暖的倾听者。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-gradient-to-br from-terracotta-400 to-terracotta-600 rounded-4xl p-10 md:p-14 text-center relative overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative">
              <Heart className="w-12 h-12 text-white/80 mx-auto mb-6" />
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                开始你的温暖旅程
              </h2>
              <p className="text-white/80 mb-8 text-lg">
                加入我们，与挚友共同书写生活的故事
              </p>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-terracotta-600 rounded-3xl font-semibold text-lg hover:bg-stone-50 transition-all duration-300 hover:shadow-lg"
              >
                立即注册
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-4 border-t border-stone-200">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-terracotta-400 to-terracotta-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-medium text-stone-700">生活日志</span>
          </div>
          <p className="text-stone-400 text-sm">
            用心记录，温暖相伴
          </p>
        </div>
      </footer>
    </div>
  )
}