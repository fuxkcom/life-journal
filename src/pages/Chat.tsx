import { useState, useEffect, useRef } from 'react'
import { supabase, Profile, Message } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { ArrowLeft, Send, User } from 'lucide-react'
import Layout from '../components/Layout'

export default function Chat() {
  const { user } = useAuth()
  const [friends, setFriends] = useState<Profile[]>([])
  const [selectedFriend, setSelectedFriend] = useState<Profile | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (user) loadFriends()
  }, [user])

  useEffect(() => {
    if (selectedFriend && user) {
      loadMessages()
      
      // Subscribe to real-time messages
      const channel = supabase
        .channel('messages')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`
        }, (payload) => {
          if (payload.new.sender_id === selectedFriend.id) {
            setMessages(prev => [...prev, payload.new as Message])
          }
        })
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [selectedFriend, user])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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

  const loadMessages = async () => {
    if (!user || !selectedFriend) return
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedFriend.id}),and(sender_id.eq.${selectedFriend.id},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true })
    setMessages(data || [])
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !selectedFriend) return
    
    const message = {
      sender_id: user.id,
      receiver_id: selectedFriend.id,
      content: newMessage.trim()
    }

    const { data, error } = await supabase.from('messages').insert(message).select().maybeSingle()
    if (!error && data) {
      setMessages([...messages, data])
      setNewMessage('')
    }
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }

  if (selectedFriend) {
    return (
      <div className="h-screen flex flex-col bg-gray-50">
        {/* Chat Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSelectedFriend(null)} className="p-2 -ml-2 hover:bg-gray-100 rounded-full md:hidden">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
            {selectedFriend.avatar_url ? (
              <img src={selectedFriend.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              <User className="w-5 h-5 text-indigo-600" />
            )}
          </div>
          <div>
            <p className="font-medium text-gray-900">{selectedFriend.display_name || selectedFriend.username}</p>
            <p className="text-sm text-gray-500">@{selectedFriend.username}</p>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                msg.sender_id === user?.id ? 'bg-indigo-600 text-white' : 'bg-white text-gray-900'
              }`}>
                <p>{msg.content}</p>
                <p className={`text-xs mt-1 ${msg.sender_id === user?.id ? 'text-indigo-200' : 'text-gray-500'}`}>
                  {formatTime(msg.created_at)}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="输入消息..."
              className="flex-1 px-4 py-3 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim()}
              className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto p-4 pb-24 md:pb-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">消息</h2>

        {friends.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            添加好友后即可开始聊天
          </div>
        ) : (
          <div className="space-y-2">
            {friends.map((friend) => (
              <button
                key={friend.id}
                onClick={() => setSelectedFriend(friend)}
                className="w-full flex items-center gap-3 p-4 bg-white rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                  {friend.avatar_url ? (
                    <img src={friend.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-indigo-600 font-medium">{friend.display_name?.[0] || friend.username[0]}</span>
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-gray-900">{friend.display_name || friend.username}</p>
                  <p className="text-sm text-gray-500">@{friend.username}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
