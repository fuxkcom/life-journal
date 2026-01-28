import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Camera, Save, Loader2, Lock, Eye, EyeOff, Check, X } from 'lucide-react'
import Layout from '../components/Layout'

function validatePassword(password: string) {
  const minLength = password.length >= 8
  const hasLetter = /[a-zA-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  return { minLength, hasLetter, hasNumber, isValid: minLength && hasLetter && hasNumber }
}

export default function Profile() {
  const { user, profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [bio, setBio] = useState(profile?.bio || '')
  const [loading, setLoading] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Password change states
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  
  const passwordValidation = validatePassword(newPassword)
  
  const handlePasswordChange = async () => {
    setPasswordError('')
    setPasswordSuccess('')
    
    if (!passwordValidation.isValid) {
      setPasswordError('新密码不符合要求')
      return
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('两次输入的密码不一致')
      return
    }
    
    setPasswordLoading(true)
    
    // First verify current password by re-authenticating
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user?.email || '',
      password: currentPassword
    })
    
    if (signInError) {
      setPasswordError('当前密码不正确')
      setPasswordLoading(false)
      return
    }
    
    // Update password
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    
    if (error) {
      setPasswordError(error.message)
    } else {
      setPasswordSuccess('密码修改成功')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    }
    setPasswordLoading(false)
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setAvatarUploading(true)
    try {
      const fileName = `${user.id}/${Date.now()}.${file.name.split('.').pop()}`
      const { data, error } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true })
      
      if (!error && data) {
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(data.path)
        await supabase.from('profiles').update({ avatar_url: urlData.publicUrl }).eq('id', user.id)
        await refreshProfile()
      }
    } catch (e) {
      alert('头像上传失败')
    } finally {
      setAvatarUploading(false)
    }
  }

  const handleSave = async () => {
    if (!user) return
    setLoading(true)

    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: displayName.trim(),
        bio: bio.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (!error) {
      await refreshProfile()
      alert('保存成功')
    } else {
      alert('保存失败: ' + error.message)
    }
    setLoading(false)
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto p-4 pb-24 md:pb-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">个人资料</h2>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          {/* Avatar */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden">
                {avatarUploading ? (
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                ) : profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl text-indigo-600 font-medium">
                    {profile?.display_name?.[0] || profile?.username?.[0]}
                  </span>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Username */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">用户名</label>
            <input
              type="text"
              value={profile?.username || ''}
              disabled
              className="w-full px-4 py-3 bg-gray-100 rounded-lg text-gray-500 cursor-not-allowed"
            />
            <p className="mt-1 text-sm text-gray-500">用户名不可修改</p>
          </div>

          {/* Display Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">昵称</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="设置你的昵称"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Bio */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">个人简介</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="介绍一下自己..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Email */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">邮箱</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-4 py-3 bg-gray-100 rounded-lg text-gray-500 cursor-not-allowed"
            />
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            保存更改
          </button>
        </div>

        {/* Password Change Section */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Lock className="w-5 h-5" />
            修改密码
          </h3>
          
          {passwordError && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">
              {passwordError}
            </div>
          )}
          
          {passwordSuccess && (
            <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm mb-4">
              {passwordSuccess}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">当前密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="输入当前密码"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">新密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="输入新密码"
                />
              </div>
              
              {newPassword && (
                <div className="mt-3 space-y-2">
                  <div className={`flex items-center gap-2 text-sm ${passwordValidation.minLength ? 'text-green-600' : 'text-gray-500'}`}>
                    {passwordValidation.minLength ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    至少8个字符
                  </div>
                  <div className={`flex items-center gap-2 text-sm ${passwordValidation.hasLetter ? 'text-green-600' : 'text-gray-500'}`}>
                    {passwordValidation.hasLetter ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    包含字母
                  </div>
                  <div className={`flex items-center gap-2 text-sm ${passwordValidation.hasNumber ? 'text-green-600' : 'text-gray-500'}`}>
                    {passwordValidation.hasNumber ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    包含数字
                  </div>
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">确认新密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="再次输入新密码"
                />
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="mt-2 text-sm text-red-600">两次输入的密码不一致</p>
              )}
            </div>
            
            <button
              onClick={handlePasswordChange}
              disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {passwordLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
              修改密码
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}
