import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, BookOpen, Users, Hash } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import type { StudyRoom, ChatMessage, Profile } from '@/types/database'
import { formatDistanceToNow } from 'date-fns'

interface MessageWithProfile extends ChatMessage {
  profile?: Profile | null
}

export function RoomPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [room, setRoom] = useState<StudyRoom | null>(null)
  const [messages, setMessages] = useState<MessageWithProfile[]>([])
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!id) return
    loadRoom()
    loadMessages()

    const channel = supabase
      .channel(`room:${id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `room_id=eq.${id}`,
      }, async (payload) => {
        const msg = payload.new as ChatMessage
        const { data: profile } = await supabase
          .from('profiles').select('*').eq('id', msg.user_id).single()
        setMessages(prev => [...prev, { ...msg, profile }])
        scrollToBottom()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [id])

  useEffect(() => { scrollToBottom() }, [messages])

  function scrollToBottom() {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  async function loadRoom() {
    const { data } = await supabase.from('study_rooms').select('*').eq('id', id!).single()
    setRoom(data)
  }

  async function loadMessages() {
    setLoading(true)
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('room_id', id!)
      .order('created_at', { ascending: true })
      .limit(100)

    if (data) {
      const profileIds = [...new Set(data.map(m => m.user_id))]
      const { data: profiles } = await supabase
        .from('profiles').select('*').in('id', profileIds)
      const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))
      setMessages(data.map(m => ({ ...m, profile: profileMap[m.user_id] ?? null })))
    }
    setLoading(false)
  }

  async function sendMessage() {
    if (!user || !message.trim() || !id) return
    setSending(true)
    await supabase.from('chat_messages').insert({
      room_id: id,
      user_id: user.id,
      content: message.trim(),
    })
    setMessage('')
    setSending(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col h-screen bg-[#0f1117]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[#0f1117] border-b border-[#2a3347] flex-shrink-0">
        <button
          onClick={() => navigate('/rooms')}
          className="p-2 rounded-lg hover:bg-[#1e2535] text-[#5a6178] hover:text-[#e8eaf0] transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="w-8 h-8 rounded-lg bg-blue-400/10 flex items-center justify-center">
          <Hash size={14} className="text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold text-[#e8eaf0] truncate">{room?.name ?? 'Loading...'}</h1>
          {room?.passage_reference && (
            <p className="text-xs text-[#5a6178] flex items-center gap-1">
              <BookOpen size={10} /> {room.passage_reference}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-[#5a6178]">
          <Users size={12} />
          {room?.member_count ?? 0}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-[#c8a97e]/30 border-t-[#c8a97e] rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-400/10 flex items-center justify-center mb-4">
              <Hash size={24} className="text-blue-400" />
            </div>
            <p className="text-[#e8eaf0] font-medium mb-1">Welcome to #{room?.name}</p>
            <p className="text-sm text-[#5a6178]">Be the first to start the conversation.</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isOwn = msg.user_id === user?.id
            const prevMsg = messages[i - 1]
            const sameUser = prevMsg?.user_id === msg.user_id

            return (
              <div key={msg.id} className={`flex gap-3 ${sameUser ? 'mt-0.5' : 'mt-4'}`}>
                {!sameUser ? (
                  <Avatar
                    src={msg.profile?.avatar_url}
                    name={msg.profile?.display_name ?? 'User'}
                    size="sm"
                  />
                ) : (
                  <div className="w-8 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  {!sameUser && (
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <span className={`text-xs font-semibold ${isOwn ? 'text-[#c8a97e]' : 'text-[#8b92a8]'}`}>
                        {msg.profile?.display_name ?? 'User'}
                      </span>
                      <span className="text-[10px] text-[#5a6178]">
                        {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  )}
                  <p className="text-sm text-[#d4d8e8] leading-relaxed break-words">{msg.content}</p>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 bg-[#0f1117] border-t border-[#2a3347] flex-shrink-0">
        {user ? (
          <div className="flex items-end gap-2 bg-[#161b27] border border-[#2a3347] rounded-xl px-3 py-2 focus-within:border-[#c8a97e]/40 transition-colors">
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message #${room?.name ?? 'room'}...`}
              rows={1}
              className="flex-1 bg-transparent text-sm text-[#e8eaf0] placeholder:text-[#5a6178] outline-none resize-none leading-relaxed max-h-32"
              style={{ minHeight: '22px' }}
            />
            <button
              onClick={sendMessage}
              disabled={!message.trim() || sending}
              className="p-1.5 rounded-lg bg-[#c8a97e] hover:bg-[#d4b990] text-[#0f1117] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0"
            >
              <Send size={14} />
            </button>
          </div>
        ) : (
          <div className="text-center py-2">
            <p className="text-sm text-[#5a6178]">
              <button onClick={() => navigate('/auth')} className="text-[#c8a97e] hover:underline">Sign in</button> to join the conversation
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
