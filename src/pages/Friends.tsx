import { useState, useEffect } from 'react'
import { supabase, Profile, Friendship } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Search, UserPlus, Check, X, Copy, Link as LinkIcon, Users } from 'lucide-react'
import Layout from '../components/Layout'

export default function Friends() {
  const { user } = useAuth()
  const [tab, setTab] = useState<'friends' | 'requests' | 'search'>('friends')
  const [friends, setFriends] = useState<Profile[]>([])
  const [requests, setRequests] = useState<(Friendship & { profile: Profile })[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Profile[]>([])
  const [searching, setSearching] = useState(false)
  const [inviteLink, setInviteLink] = useState('')

  useEffect(() => {
    if (user) {
      loadFriends()
      loadRequests()
      setInviteLink(`${window.location.origin}/invite/${user.id}`)
    }
  }, [user])

  const loadFriends = async () => {
    if (!user) return
    const { data: friendships } = await supabase
      .from('friendships')
      .select('*')
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
      .eq('status', 'accepted')

    if (friendships && friendships.length > 0) {
      const friendIds = friendships.map(f => f.user_id === user.id ? f.friend_id : f.user_id)
      const { data: profiles } = await supabase.from('profiles').select('*').in('id', friendIds)
      setFriends(profiles || [])
    }
  }

  const loadRequests = async () => {
    if (!user) return
    const { data: reqs } = await supabase
      .from('friendships')
      .select('*')
      .eq('friend_id', user.id)
      .eq('status', 'pending')

    if (reqs && reqs.length > 0) {
      const userIds = reqs.map(r => r.user_id)
      const { data: profiles } = await supabase.from('profiles').select('*').in('id', userIds)
      setRequests(reqs.map(r => ({
        ...r,
        profile: profiles?.find(p => p.id === r.user_id) as Profile
      })))
    }
  }

  const searchUsers = async () => {
    if (!searchQuery.trim() || !user) return
    setSearching(true)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
      .neq('id', user.id)
      .limit(20)
    setSearchResults(data || [])
    setSearching(false)
  }

  const sendFriendRequest = async (friendId: string) => {
    if (!user) return
    const { error } = await supabase.from('friendships').insert({
      user_id: user.id,
      friend_id: friendId,
      status: 'pending'
    })
    if (!error) {
      alert('好友请求已发送')
      setSearchResults(searchResults.filter(p => p.id !== friendId))
    }
  }

  const handleRequest = async (requestId: string, accept: boolean) => {
    const { error } = await supabase
      .from('friendships')
      .update({ status: accept ? 'accepted' : 'rejected' })
      .eq('id', requestId)
    
    if (!error) {
      loadFriends()
      loadRequests()
    }
  }

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink)
    alert('邀请链接已复制')
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto p-4 pb-24 md:pb-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">好友</h2>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'friends', label: '我的好友', icon: Users },
            { key: 'requests', label: `请求${requests.length > 0 ? ` (${requests.length})` : ''}`, icon: UserPlus },
            { key: 'search', label: '搜索', icon: Search },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key as typeof tab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-colors ${
                tab === key ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Invite Link */}
        <div className="bg-indigo-50 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <LinkIcon className="w-5 h-5 text-indigo-600" />
            <span className="font-medium text-indigo-900">邀请链接</span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={inviteLink}
              readOnly
              className="flex-1 px-3 py-2 bg-white rounded-lg text-sm text-gray-600"
            />
            <button
              onClick={copyInviteLink}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2 hover:bg-indigo-700"
            >
              <Copy className="w-4 h-4" />
              复制
            </button>
          </div>
        </div>

        {/* Friends List */}
        {tab === 'friends' && (
          <div className="space-y-3">
            {friends.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                还没有好友，去搜索或分享邀请链接吧
              </div>
            ) : (
              friends.map((friend) => (
                <div key={friend.id} className="flex items-center gap-3 p-4 bg-white rounded-xl">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden">
                    {friend.avatar_url ? (
                      <img src={friend.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-indigo-600 font-medium">{friend.display_name?.[0] || friend.username[0]}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{friend.display_name || friend.username}</p>
                    <p className="text-sm text-gray-500">@{friend.username}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Friend Requests */}
        {tab === 'requests' && (
          <div className="space-y-3">
            {requests.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                暂无好友请求
              </div>
            ) : (
              requests.map((req) => (
                <div key={req.id} className="flex items-center gap-3 p-4 bg-white rounded-xl">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                    <span className="text-indigo-600 font-medium">{req.profile?.display_name?.[0] || req.profile?.username[0]}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{req.profile?.display_name || req.profile?.username}</p>
                    <p className="text-sm text-gray-500">@{req.profile?.username}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRequest(req.id, true)}
                      className="p-2 bg-green-100 text-green-600 rounded-full hover:bg-green-200"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleRequest(req.id, false)}
                      className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Search */}
        {tab === 'search' && (
          <div>
            <div className="flex gap-2 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
                  placeholder="搜索用户名或邮箱..."
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={searchUsers}
                disabled={searching}
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                搜索
              </button>
            </div>

            <div className="space-y-3">
              {searchResults.map((profile) => (
                <div key={profile.id} className="flex items-center gap-3 p-4 bg-white rounded-xl">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                    <span className="text-indigo-600 font-medium">{profile.display_name?.[0] || profile.username[0]}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{profile.display_name || profile.username}</p>
                    <p className="text-sm text-gray-500">@{profile.username}</p>
                  </div>
                  <button
                    onClick={() => sendFriendRequest(profile.id)}
                    className="px-4 py-2 bg-indigo-100 text-indigo-600 rounded-lg font-medium hover:bg-indigo-200"
                  >
                    添加好友
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
