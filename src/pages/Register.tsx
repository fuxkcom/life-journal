import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Mail, Lock, User, UserPlus, BookOpen, Eye, EyeOff, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase' // 添加supabase导入

// 检查邮箱是否已存在
const checkEmailExists = async (email: string): Promise<boolean> => {
  try {
    // 方法1：通过auth API检查邮箱是否已注册
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password: 'dummy_password' // 使用虚拟密码尝试登录
    })
    
    // 如果错误是"Invalid login credentials"但能验证邮箱存在，说明邮箱已注册
    if (authError?.message?.includes('Invalid login credentials')) {
      // 邮箱存在但密码错误，说明邮箱已注册
      return true
    }
    
    // 如果没有错误且返回了用户数据，说明邮箱已注册
    if (authData?.user) {
      return true
    }
    
    // 方法2：通过公共profiles表检查（如果存在）
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('email')
      .eq('email', email)
      .maybeSingle()
    
    return !!profileData
    
  } catch (error) {
    console.error('检查邮箱是否存在时出错:', error)
    // 如果检查出错，保守起见返回false，让后端验证
    return false
  }
}

// 密码强度检查
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
  
  if (passed >= 5) {
    strength = 'strong'
    color = 'text-green-500'
  } else if (passed >= 3) {
    strength = 'medium'
    color = 'text-yellow-500'
  }
  
  return { checks, strength, color, passed }
}

// 用户名验证
const validateUsername = (username: string) => {
  if (username.length < 3) return '用户名至少3个字符'
  if (username.length > 20) return '用户名不能超过20个字符'
  if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(username)) return '只能包含中英文、数字和下划线'
  return ''
}

// 邮箱验证
const validateEmail = async (email: string): Promise<string> => {
  if (!email) return '请输入邮箱地址'
  
  // 基础格式验证
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) return '邮箱格式不正确'
  
  // 检查常见的邮箱服务商
  const commonDomains = [
    'gmail.com', 'qq.com', '163.com', '126.com', 'sina.com',
    'sohu.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
    'foxmail.com', 'icloud.com', 'aliyun.com', '139.com'
  ]
  
  const domain = email.split('@')[1]
  if (!commonDomains.includes(domain.toLowerCase())) {
    // 如果不是常见邮箱，进行额外的格式检查
    const domainRegex = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!domainRegex.test(domain)) {
      return '邮箱域名格式不正确'
    }
  }
  
  return ''
}

// 错误信息本地化映射
const localizeError = (message: string): string => {
  const errorMap: Record<string, string> = {
    'User already registered': '该邮箱已被注册，请直接登录',
    'duplicate key value violates unique constraint "users_email_key"': '该邮箱已被注册',
    'duplicate key value violates unique constraint "profiles_email_key"': '该邮箱已被注册',
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
  
  // 关键词匹配（优先顺序）
  const keyPhrases = [
    { phrase: 'already registered', message: '该邮箱已被注册，请直接登录' },
    { phrase: 'already exists', message: '该邮箱已被注册' },
    { phrase: 'duplicate key', message: '该邮箱已被注册' },
    { phrase: 'email already', message: '该邮箱已被注册' },
    { phrase: 'already in use', message: '该邮箱已被使用' },
    { phrase: 'invalid email', message: '邮箱格式不正确' },
    { phrase: 'password too short', message: '密码至少需要6个字符' },
    { phrase: 'weak password', message: '密码强度太弱' },
    { phrase: 'username taken', message: '用户名已被使用' },
    { phrase: 'network error', message: '网络连接失败，请检查网络' },
    { phrase: 'timeout', message: '请求超时，请重试' },
  ]
  
  const lowerMessage = message.toLowerCase()
  for (const { phrase, message: msg } of keyPhrases) {
    if (lowerMessage.includes(phrase)) return msg
  }
  
  // 检查是否为Supabase特定的重复邮箱错误
  if (message.includes('duplicate') && (message.includes('email') || message.includes('user'))) {
    return '该邮箱已被注册'
  }
  
  return errorMap[message] || '注册失败，请稍后再试'
}

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    username: '',
    form: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [checkingEmail, setCheckingEmail] = useState(false)
  const [touched, setTouched] = useState({
    email: false,
    password: false,
    username: false
  })
  
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const emailRef = useRef<HTMLInputElement>(null)
  const usernameRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  // 检查表单是否有效
  const isFormValid = () => {
    return (
      email.trim() !== '' &&
      password.trim() !== '' &&
      username.trim() !== '' &&
      !errors.email &&
      !errors.username &&
      !errors.password &&
      password.length >= 6
    )
  }

  // 实时邮箱验证（防抖）
  useEffect(() => {
    const validateEmailAsync = async () => {
      if (!email || !touched.email) return
      
      // 清除之前的错误
      setErrors(prev => ({ ...prev, email: '' }))
      
      // 基础验证
      const formatError = await validateEmail(email)
      if (formatError) {
        setErrors(prev => ({ ...prev, email: formatError }))
        return
      }
      
      // 检查邮箱是否已存在（仅在格式正确且用户停止输入后）
      setCheckingEmail(true)
      try {
        const exists = await checkEmailExists(email)
        if (exists) {
          setErrors(prev => ({ 
            ...prev, 
            email: '该邮箱已被注册，请直接登录',
            form: '' // 清除表单级错误
          }))
        }
      } catch (error) {
        console.error('邮箱检查失败:', error)
      } finally {
        setCheckingEmail(false)
      }
    }

    const timer = setTimeout(validateEmailAsync, 800) // 800ms防抖
    return () => clearTimeout(timer)
  }, [email, touched.email])

  // 处理输入变化
  const handleInputChange = (field: string, value: string) => {
    // 更新字段值
    if (field === 'email') {
      setEmail(value)
      // 邮箱改变时清除相关错误
      if (errors.email) {
        setErrors(prev => ({ ...prev, email: '' }))
      }
    }
    if (field === 'password') setPassword(value)
    if (field === 'username') setUsername(value)
    
    // 如果是验证状态且字段已被触摸，立即验证（除了邮箱，因为邮箱有防抖验证）
    if (touched[field as keyof typeof touched] && field !== 'email') {
      if (field === 'username') {
        const error = validateUsername(value)
        setErrors(prev => ({ ...prev, [field]: error }))
      } else if (field === 'password') {
        const error = value.length < 6 ? '密码至少需要6个字符' : ''
        setErrors(prev => ({ ...prev, [field]: error }))
      }
    }
  }

  // 处理失去焦点
  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    
    if (field === 'username') {
      const error = validateUsername(username)
      setErrors(prev => ({ ...prev, [field]: error }))
    } else if (field === 'password') {
      const error = password.length < 6 ? '密码至少需要6个字符' : ''
      setErrors(prev => ({ ...prev, [field]: error }))
    }
    // 邮箱验证在useEffect中处理（防抖）
  }

  // 重置表单
  const resetForm = () => {
    setEmail('')
    setPassword('')
    setUsername('')
    setErrors({ email: '', password: '', username: '', form: '' })
    setTouched({ email: false, password: false, username: false })
    setShowPassword(false)
    setCheckingEmail(false)
  }

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 标记所有字段为已触摸
    setTouched({ email: true, password: true, username: true })
    
    // 重新验证所有字段
    const emailError = await validateEmail(email)
    const passwordError = password.length < 6 ? '密码至少需要6个字符' : ''
    const usernameError = validateUsername(username)
    
    // 最后检查一次邮箱是否已存在
    let finalEmailError = emailError
    if (!emailError) {
      try {
        const exists = await checkEmailExists(email)
        if (exists) {
          finalEmailError = '该邮箱已被注册，请直接登录'
        }
      } catch (error) {
        console.error('提交前邮箱检查失败:', error)
      }
    }
    
    const newErrors = {
      email: finalEmailError,
      password: passwordError,
      username: usernameError,
      form: ''
    }
    
    setErrors(newErrors)
    
    // 如果有错误，聚焦到第一个错误字段
    if (finalEmailError || passwordError || usernameError) {
      if (finalEmailError && emailRef.current) {
        emailRef.current.focus()
      } else if (usernameError && usernameRef.current) {
        usernameRef.current.focus()
      } else if (passwordError && passwordRef.current) {
        passwordRef.current.focus()
      }
      return
    }
    
    setIsSubmitting(true)
    setErrors(prev => ({ ...prev, form: '' }))
    
    try {
      const { error } = await signUp(email, password, username)
      
      if (error) {
        const localizedError = localizeError(error.message)
        
        // 如果是重复邮箱错误，特别处理
        if (localizedError.includes('邮箱已被注册')) {
          setErrors(prev => ({ 
            ...prev, 
            email: localizedError,
            form: ''
          }))
          if (emailRef.current) emailRef.current.focus()
        } else if (localizedError.includes('用户名')) {
          setErrors(prev => ({ ...prev, username: localizedError }))
          if (usernameRef.current) usernameRef.current.focus()
        } else {
          setErrors(prev => ({ ...prev, form: localizedError }))
        }
      } else {
        // 注册成功
        resetForm()
        navigate('/')
      }
    } catch (error: any) {
      console.error('注册错误:', error)
      const errorMessage = error?.message || '注册失败'
      const localizedError = localizeError(errorMessage)
      
      if (localizedError.includes('邮箱已被注册')) {
        setErrors(prev => ({ ...prev, email: localizedError }))
        if (emailRef.current) emailRef.current.focus()
      } else {
        setErrors(prev => ({ ...prev, form: localizedError }))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // 自动清除表单级错误
  useEffect(() => {
    if (errors.form) {
      const timer = setTimeout(() => {
        setErrors(prev => ({ ...prev, form: '' }))
      }, 8000)
      return () => clearTimeout(timer)
    }
  }, [errors.form])

  const passwordStrength = checkPasswordStrength(password)

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link 
          to="/welcome" 
          className="flex items-center justify-center gap-3 mb-8 group"
          onClick={resetForm}
        >
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

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 表单错误 */}
            {errors.form && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 animate-fade-in">
                <div className="flex items-center gap-3 text-red-600">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <p className="font-medium mb-1">注册失败</p>
                    <p className="text-sm">{errors.form}</p>
                  </div>
                </div>
              </div>
            )}

            {/* 用户名输入 */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-stone-700">
                用户名
                {touched.username && errors.username && (
                  <span className="text-red-500 text-xs ml-2">{errors.username}</span>
                )}
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <User className={`w-5 h-5 transition-colors ${errors.username && touched.username ? 'text-red-400' : 'text-stone-400 group-focus-within:text-terracotta-500'}`} />
                </div>
                <input
                  ref={usernameRef}
                  type="text"
                  value={username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  onBlur={() => handleBlur('username')}
                  className={`w-full pl-12 pr-10 py-3.5 bg-stone-50/50 border rounded-2xl focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-400 transition-all duration-300 ${
                    errors.username && touched.username
                      ? 'border-red-300 focus:border-red-400 focus:ring-red-500/20'
                      : 'border-stone-200'
                  }`}
                  placeholder="请输入用户名"
                  required
                  maxLength={20}
                  disabled={isSubmitting}
                />
                {touched.username && username && !errors.username && (
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

            {/* 邮箱输入 */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-stone-700 flex items-center gap-2">
                邮箱地址
                {checkingEmail && (
                  <span className="text-xs text-amber-500 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    检查中...
                  </span>
                )}
                {touched.email && errors.email && !checkingEmail && (
                  <span className="text-red-500 text-xs">{errors.email}</span>
                )}
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <Mail className={`w-5 h-5 transition-colors ${errors.email && touched.email ? 'text-red-400' : 'text-stone-400 group-focus-within:text-terracotta-500'}`} />
                </div>
                <input
                  ref={emailRef}
                  type="email"
                  value={email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                  className={`w-full pl-12 pr-10 py-3.5 bg-stone-50/50 border rounded-2xl focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-400 transition-all duration-300 ${
                    errors.email && touched.email
                      ? 'border-red-300 focus:border-red-400 focus:ring-red-500/20'
                      : 'border-stone-200'
                  }`}
                  placeholder="your@email.com"
                  required
                  disabled={isSubmitting || checkingEmail}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {checkingEmail ? (
                    <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
                  ) : touched.email && email && !errors.email ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : touched.email && errors.email ? (
                    <XCircle className="w-5 h-5 text-red-500" />
                  ) : null}
                </div>
              </div>
              {errors.email && errors.email.includes('已被注册') && (
                <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>
                    该邮箱已注册？{' '}
                    <Link 
                      to="/login" 
                      className="text-terracotta-600 hover:text-terracotta-700 font-medium underline"
                    >
                      立即登录
                    </Link>
                  </span>
                </div>
              )}
            </div>

            {/* 密码输入 */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-stone-700">
                密码
                {touched.password && errors.password && (
                  <span className="text-red-500 text-xs ml-2">{errors.password}</span>
                )}
                {touched.password && password && !errors.password && (
                  <span className={`text-xs ml-2 ${passwordStrength.color}`}>
                    {passwordStrength.strength === 'strong' ? '强' : 
                     passwordStrength.strength === 'medium' ? '中' : '弱'}
                  </span>
                )}
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <Lock className={`w-5 h-5 transition-colors ${errors.password && touched.password ? 'text-red-400' : 'text-stone-400 group-focus-within:text-terracotta-500'}`} />
                </div>
                <input
                  ref={passwordRef}
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  onBlur={() => handleBlur('password')}
                  className={`w-full pl-12 pr-12 py-3.5 bg-stone-50/50 border rounded-2xl focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-400 transition-all duration-300 ${
                    errors.password && touched.password
                      ? 'border-red-300 focus:border-red-400 focus:ring-red-500/20'
                      : 'border-stone-200'
                  }`}
                  placeholder="至少6位字符"
                  minLength={6}
                  required
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-600 transition-colors"
                  aria-label={showPassword ? "隐藏密码" : "显示密码"}
                  disabled={isSubmitting}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* 密码强度指示器 */}
              {password.length > 0 && (
                <div className="space-y-2 animate-fade-in">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-stone-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          passwordStrength.passed >= 5 ? 'bg-green-500' :
                          passwordStrength.passed >= 3 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${(passwordStrength.passed / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      {passwordStrength.checks.length ? (
                        <CheckCircle className="w-3 h-3 text-green-500" />
                      ) : (
                        <XCircle className="w-3 h-3 text-stone-300" />
                      )}
                      <span className={password.length >= 6 ? 'text-green-600' : 'text-stone-400'}>
                        至少6位
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {passwordStrength.checks.hasUpperCase ? (
                        <CheckCircle className="w-3 h-3 text-green-500" />
                      ) : (
                        <XCircle className="w-3 h-3 text-stone-300" />
                      )}
                      <span className={passwordStrength.checks.hasUpperCase ? 'text-green-600' : 'text-stone-400'}>
                        大写字母
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {passwordStrength.checks.hasLowerCase ? (
                        <CheckCircle className="w-3 h-3 text-green-500" />
                      ) : (
                        <XCircle className="w-3 h-3 text-stone-300" />
                      )}
                      <span className={passwordStrength.checks.hasLowerCase ? 'text-green-600' : 'text-stone-400'}>
                        小写字母
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {passwordStrength.checks.hasNumber ? (
                        <CheckCircle className="w-3 h-3 text-green-500" />
                      ) : (
                        <XCircle className="w-3 h-3 text-stone-300" />
                      )}
                      <span className={passwordStrength.checks.hasNumber ? 'text-green-600' : 'text-stone-400'}>
                        数字
                      </span>
                    </div>
                    <div className="flex items-center gap-2 col-span-2">
                      {passwordStrength.checks.hasSpecialChar ? (
                        <CheckCircle className="w-3 h-3 text-green-500" />
                      ) : (
                        <XCircle className="w-3 h-3 text-stone-300" />
                      )}
                      <span className={passwordStrength.checks.hasSpecialChar ? 'text-green-600' : 'text-stone-400'}>
                        特殊字符（如!@#$%）
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 提交按钮 */}
            <button
              type="submit"
              disabled={isSubmitting || !isFormValid() || checkingEmail}
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
              <p className="text-stone-500 mb-2">
                已有账户？
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-terracotta-600 hover:text-terracotta-700 font-medium transition-colors group"
              >
                <span className="group-hover:underline">立即登录</span>
                <span className="transform group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-xs text-stone-400">
                注册即表示您同意我们的
                <Link to="/terms" className="text-stone-500 hover:text-stone-700 mx-1">
                  服务条款
                </Link>
                和
                <Link to="/privacy" className="text-stone-500 hover:text-stone-700 mx-1">
                  隐私政策
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
