import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useAuth } from '../contexts/AuthContext'
import {
  Mail, Lock, User, UserPlus, BookOpen, Eye, EyeOff,
  CheckCircle, XCircle, AlertCircle, Loader2
} from 'lucide-react'

// ---------- Zod 校验 Schema ----------
const registerSchema = z.object({
  username: z.string()
    .min(3, '用户名至少3个字符')
    .max(20, '用户名不能超过20个字符')
    .regex(/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/, '只能包含中英文、数字和下划线'),
  email: z.string()
    .min(1, '请输入邮箱地址')
    .email('邮箱格式不正确'),
  password: z.string()
    .min(6, '密码至少需要6个字符')
})

type RegisterFormData = z.infer<typeof registerSchema>

// ---------- 密码强度工具 ----------
const checkPasswordStrength = (password: string) => {
  const checks = {
    length: password.length >= 6,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  }
  const passed = Object.values(checks).filter(Boolean).length
  let strength = 'weak'
  let color = 'text-red-500'
  if (passed >= 5) { strength = 'strong'; color = 'text-green-500' }
  else if (passed >= 3) { strength = 'medium'; color = 'text-yellow-500' }
  return { checks, strength, color, passed }
}

// ---------- 错误信息本地化 ----------
const localizeError = (message: string): string => {
  const errorMap: Record<string, string> = {
    'User already registered': '该邮箱已被注册，请直接登录',
    'duplicate key value violates unique constraint "users_email_key"': '该邮箱已被注册',
    'Invalid login credentials': '邮箱或密码错误',
    'Email not confirmed': '邮箱未验证，请检查您的邮箱',
    'Password should be at least 6 characters': '密码至少需要6个字符',
    'Unable to validate email address: invalid format': '邮箱格式不正确',
    'Signup requires a valid password': '请输入有效的密码',
    'To signup, please provide your email': '请输入邮箱地址',
    'Email rate limit exceeded': '请求过于频繁，请稍后再试',
    'For security purposes, you can only request this once every 60 seconds': '安全限制：请60秒后再试',
    'Password is too weak': '密码强度太弱，请使用更复杂的密码',
    'Username already taken': '用户名已被使用',
    'Invalid username': '用户名格式不正确',
    'Email already in use': '该邮箱已被使用',
    'A user with this email address has already been registered': '该邮箱已被注册',
  }
  // 关键词匹配
  const keyPhrases = [
    { phrase: 'already registered', msg: '该邮箱已被注册，请直接登录' },
    { phrase: 'already exists', msg: '该邮箱已被注册' },
    { phrase: 'duplicate key', msg: '该邮箱已被注册' },
    { phrase: 'email already', msg: '该邮箱已被注册' },
    { phrase: 'already in use', msg: '该邮箱已被使用' },
    { phrase: 'invalid email', msg: '邮箱格式不正确' },
    { phrase: 'password too short', msg: '密码至少需要6个字符' },
    { phrase: 'weak password', msg: '密码强度太弱' },
    { phrase: 'username taken', msg: '用户名已被使用' },
    { phrase: 'network error', msg: '网络连接失败，请检查网络' },
    { phrase: 'timeout', msg: '请求超时，请重试' },
  ]
  const lower = message.toLowerCase()
  for (const { phrase, msg } of keyPhrases) {
    if (lower.includes(phrase)) return msg
  }
  return errorMap[message] || '注册失败，请稍后再试'
}

// ---------- 密码强度指示器子组件 ----------
const PasswordStrengthIndicator = ({ password }: { password: string }) => {
  if (!password) return null
  const { checks, strength, color, passed } = checkPasswordStrength(password)
  const percent = (passed / 5) * 100

  return (
    <div className="space-y-2 animate-fade-in">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-stone-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              passed >= 5 ? 'bg-green-500' : passed >= 3 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className={`text-xs font-medium ${color}`}>
          {strength === 'strong' ? '强' : strength === 'medium' ? '中' : '弱'}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-2">
          {checks.length ? <CheckCircle className="w-3 h-3 text-green-500" /> : <XCircle className="w-3 h-3 text-stone-300" />}
          <span className={checks.length ? 'text-green-600' : 'text-stone-400'}>至少6位</span>
        </div>
        <div className="flex items-center gap-2">
          {checks.hasUpperCase ? <CheckCircle className="w-3 h-3 text-green-500" /> : <XCircle className="w-3 h-3 text-stone-300" />}
          <span className={checks.hasUpperCase ? 'text-green-600' : 'text-stone-400'}>大写字母</span>
        </div>
        <div className="flex items-center gap-2">
          {checks.hasLowerCase ? <CheckCircle className="w-3 h-3 text-green-500" /> : <XCircle className="w-3 h-3 text-stone-300" />}
          <span className={checks.hasLowerCase ? 'text-green-600' : 'text-stone-400'}>小写字母</span>
        </div>
        <div className="flex items-center gap-2">
          {checks.hasNumber ? <CheckCircle className="w-3 h-3 text-green-500" /> : <XCircle className="w-3 h-3 text-stone-300" />}
          <span className={checks.hasNumber ? 'text-green-600' : 'text-stone-400'}>数字</span>
        </div>
        <div className="flex items-center gap-2 col-span-2">
          {checks.hasSpecialChar ? <CheckCircle className="w-3 h-3 text-green-500" /> : <XCircle className="w-3 h-3 text-stone-300" />}
          <span className={checks.hasSpecialChar ? 'text-green-600' : 'text-stone-400'}>特殊字符（如!@#$%）</span>
        </div>
      </div>
    </div>
  )
}

// ---------- 主组件 ----------
export default function Register() {
  const navigate = useNavigate()
  const { signUp } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, touchedFields, isValid },
    setError,
    clearErrors,
    reset,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange', // 实时校验，但只显示 touched 后的错误
  })

  const password = watch('password', '')
  const email = watch('email', '')

  // 提交处理
  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true)
    try {
      const { error } = await signUp(data.email, data.password, data.username)
      if (error) {
        const localized = localizeError(error.message)
        // 将错误映射到对应字段
        if (localized.includes('邮箱')) {
          setError('email', { type: 'manual', message: localized })
        } else if (localized.includes('用户名')) {
          setError('username', { type: 'manual', message: localized })
        } else {
          // 全局错误（form）通过 setError 的 root 方式
          setError('root', { type: 'manual', message: localized })
        }
      } else {
        reset()
        navigate('/')
      }
    } catch (err: any) {
      setError('root', { type: 'manual', message: localizeError(err.message) })
    } finally {
      setIsSubmitting(false)
    }
  }

  // 清空字段错误（当用户重新输入时）
  const handleFieldChange = (field: keyof RegisterFormData) => {
    if (errors[field]) clearErrors(field)
    if (errors.root) clearErrors('root')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link to="/welcome" className="flex items-center justify-center gap-3 mb-8 group">
          <div className="w-12 h-12 bg-gradient-to-br from-terracotta-400 to-terracotta-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div className="text-left">
            <h1 className="font-bold text-2xl text-stone-800 tracking-tight">生活日志</h1>
            <p className="text-sm text-stone-500">记录生活的每一刻</p>
          </div>
        </Link>

        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-soft-xl border border-white/40 p-8">
          <div className="text-center mb-10">
            <h1 className="text-2xl font-bold text-stone-900 mb-3">创建账户</h1>
            <p className="text-stone-500">加入我们，开始记录精彩生活</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* 全局错误 */}
            {errors.root && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 animate-fade-in">
                <div className="flex items-center gap-3 text-red-600">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <p className="font-medium mb-1">注册失败</p>
                    <p className="text-sm">{errors.root.message}</p>
                  </div>
                </div>
              </div>
            )}

            {/* 用户名 */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-stone-700">
                用户名
                {touchedFields.username && errors.username && (
                  <span className="text-red-500 text-xs ml-2">{errors.username.message}</span>
                )}
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <User className={`w-5 h-5 transition-colors ${errors.username && touchedFields.username ? 'text-red-400' : 'text-stone-400 group-focus-within:text-terracotta-500'}`} />
                </div>
                <input
                  {...register('username')}
                  onChange={(e) => { register('username').onChange(e); handleFieldChange('username') }}
                  className={`w-full pl-12 pr-10 py-3.5 bg-stone-50/50 border rounded-2xl focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-400 transition-all duration-300 ${
                    errors.username && touchedFields.username
                      ? 'border-red-300 focus:border-red-400 focus:ring-red-500/20'
                      : 'border-stone-200'
                  }`}
                  placeholder="请输入用户名"
                  maxLength={20}
                  disabled={isSubmitting}
                />
                {touchedFields.username && !errors.username && watch('username') && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs text-stone-500 px-1">
                <span>• 3-20个字符</span>
                <span>• 支持中文、英文、数字</span>
              </div>
            </div>

            {/* 邮箱 */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-stone-700">
                邮箱地址
                {touchedFields.email && errors.email && (
                  <span className="text-red-500 text-xs ml-2">{errors.email.message}</span>
                )}
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <Mail className={`w-5 h-5 transition-colors ${errors.email && touchedFields.email ? 'text-red-400' : 'text-stone-400 group-focus-within:text-terracotta-500'}`} />
                </div>
                <input
                  {...register('email')}
                  onChange={(e) => { register('email').onChange(e); handleFieldChange('email') }}
                  className={`w-full pl-12 pr-10 py-3.5 bg-stone-50/50 border rounded-2xl focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-400 transition-all duration-300 ${
                    errors.email && touchedFields.email
                      ? 'border-red-300 focus:border-red-400 focus:ring-red-500/20'
                      : 'border-stone-200'
                  }`}
                  placeholder="your@email.com"
                  disabled={isSubmitting}
                />
                {touchedFields.email && watch('email') && !errors.email && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                )}
                {touchedFields.email && errors.email && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <XCircle className="w-5 h-5 text-red-500" />
                  </div>
                )}
              </div>
              {errors.email?.message?.includes('已被注册') && (
                <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>
                    该邮箱已注册？{' '}
                    <Link to="/login" className="text-terracotta-600 hover:text-terracotta-700 font-medium underline">
                      立即登录
                    </Link>
                  </span>
                </div>
              )}
            </div>

            {/* 密码 */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-stone-700">
                密码
                {touchedFields.password && errors.password && (
                  <span className="text-red-500 text-xs ml-2">{errors.password.message}</span>
                )}
                {touchedFields.password && watch('password') && !errors.password && (
                  <span className={`text-xs ml-2 ${checkPasswordStrength(watch('password')).color}`}>
                    {checkPasswordStrength(watch('password')).strength === 'strong' ? '强' :
                     checkPasswordStrength(watch('password')).strength === 'medium' ? '中' : '弱'}
                  </span>
                )}
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <Lock className={`w-5 h-5 transition-colors ${errors.password && touchedFields.password ? 'text-red-400' : 'text-stone-400 group-focus-within:text-terracotta-500'}`} />
                </div>
                <input
                  {...register('password')}
                  onChange={(e) => { register('password').onChange(e); handleFieldChange('password') }}
                  type={showPassword ? 'text' : 'password'}
                  className={`w-full pl-12 pr-12 py-3.5 bg-stone-50/50 border rounded-2xl focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-400 transition-all duration-300 ${
                    errors.password && touchedFields.password
                      ? 'border-red-300 focus:border-red-400 focus:ring-red-500/20'
                      : 'border-stone-200'
                  }`}
                  placeholder="至少6位字符"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-600 transition-colors"
                  aria-label={showPassword ? '隐藏密码' : '显示密码'}
                  disabled={isSubmitting}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* 密码强度指示器 */}
              <PasswordStrengthIndicator password={password} />
            </div>

            {/* 提交按钮 */}
            <button
              type="submit"
              disabled={isSubmitting || !isValid}
              className="w-full bg-gradient-to-r from-terracotta-500 to-terracotta-600 hover:from-terracotta-600 hover:to-terracotta-700 text-white py-4 rounded-2xl font-medium transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg active:scale-[0.99] group mt-8"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>注册中...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5 transition-transform group-hover:scale-110" />
                  <span>立即注册</span>
                </>
              )}
            </button>
          </form>

          {/* 底部链接 */}
          <div className="mt-8 pt-6 border-t border-stone-200">
            <div className="text-center">
              <p className="text-stone-500 mb-2">已有账户？</p>
              <Link to="/login" className="inline-flex items-center gap-2 text-terracotta-600 hover:text-terracotta-700 font-medium transition-colors group">
                <span className="group-hover:underline">立即登录</span>
                <span className="transform group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>
            <div className="mt-6 text-center">
              <p className="text-xs text-stone-400">
                注册即表示您同意我们的
                <Link to="/terms" className="text-stone-500 hover:text-stone-700 mx-1">服务条款</Link>
                和
                <Link to="/privacy" className="text-stone-500 hover:text-stone-700 mx-1">隐私政策</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
