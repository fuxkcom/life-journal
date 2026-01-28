import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase, Profile } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { UserPlus, Loader2 } from 'lucide-react'

export default function Invite() {
  const { userId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [inviter, setInviter] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (userId) {
      loadInviter()
    }
  }, [userId])

  const loadInviter = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
    setInviter(data)
    setLoading(false)
  }

  const acceptInvite = async () => {
    if (!user || !userId) {
      navigate('/login')
      return
    }

    setSending(true)
    const { error } = await supabase.from('friendships').insert({
      user_id: user.id,
      friend_id: userId,
      status: 'pending'
    })

    if (!error) {
      alert('好友请求已发送')
      navigate('/friends')
    } else {
      alert('发送失败: ' + error.message)
    }
    setSending(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    )
  }

  if (!inviter) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">邀请链接无效</p>
          <button onClick={() => navigate('/')} className="text-indigo-600 hover:underline">
            返回首页
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-6">
          {inviter.avatar_url ? (
            <img src={inviter.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            <span className="text-2xl text-indigo-600 font-medium">
              {inviter.display_name?.[0] || inviter.username[0]}
            </span>
          )}
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {inviter.display_name || inviter.username}
        </h1>
        <p className="text-gray-500 mb-6">@{inviter.username}</p>
        <p className="text-gray-600 mb-8">邀请你成为好友</p>

        {user ? (
          user.id === userId ? (
            <p className="text-gray-500">这是你自己的邀请链接</p>
          ) : (
            <button
              onClick={acceptInvite}
              disabled={sending}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
              添加好友
            </button>
          )
        ) : (
          <div className="space-y-3">
            <button
              onClick={() => navigate('/register')}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors"
            >
              注册账户
            </button>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              已有账户？登录
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
