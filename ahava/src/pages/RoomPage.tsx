import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, BookOpen, Users, Hash, AlertCircle } from 'lucide-react'
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
  const { user, profile: myProfile } = useAuth()
  const navigate = useNavigate()

  const [room, setRoom] = useState<StudyRoom | null>(null)
  const [messages, setMessages] = useState<MessageWithProfile[]>([])
  const [isMember, setIsMember] = useState(false)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [roomNotFound, setRoomNotFound] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const profileCache = useRef<Record<string, Profile>>({})

  const scrollToBottom = useCallback(() => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 60)
  }, [])

  useEffect(() => {
    if (!id || !user) return
    init()

    const channel = supabase
      .channel(`room-chat:${id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `room_id=eq.${id}`,
      }, async (payload) => {
        const msg = payload.new as ChatMessage
        // Get profile from cache or fetch
        let prof = profileCache.current[msg.user_id]
        if (!prof) {
          const { data } = await supabase.from('profiles').select('*').eq('id', msg.user_id).single()
          if (data) { prof = data; profileCache.current[data.id] = data }
        }
        setMessages(prev => [...prev, { ...msg, profile: prof ?? null }])
        scrollToBottom()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [id, user])

  useEffect(() => { scrollToBottom() }, [messages.length])

  async function init() {
    setLoading(true)
    const [roomRes, memberRes, msgRes] = await Promise.all([
      supabase.from('study_rooms').select('*').eq('id', id!).single(),
      supabase.from('room_members').select('id').eq('room_id', id!).eq('user_id', user!.id).single(),
      supabase.from('chat_messages').select('*').eq('room_id', id!).order('created_at', { ascending: true }).limit(100),
    ])

    if (roomRes.error || !roomRes.data) { setRoomNotFound(true); setLoading(false); return }
    setRoom(roomRes.data)
    setIsMember(!!memberRes.data)

    if (msgRes.data && msgRes.data.length > 0) {
      const profileIds = [...new Set(msgRes.data.map(m => m.user_id))]
      const { data: profiles } = await supabase.from('profiles').select('*').in('id', profileIds)
      profiles?.forEach(p => { profileCache.current[p.id] = p })
      const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))
      setMessages(msgRes.data.map(m => ({ ...m, profile: profileMap[m.user_id] ?? null })))
    }

    setLoading(false)
  }

  async function sendMessage() {
    if (!user || !message.trim() || !id || sending) return
    const content = message.trim()
    setMessage('')
    setSending(true)

    const { error } = await supabase.from('chat_messages').insert({
      room_id: id,
      user_id: user.id,
      content,
    })

    if (error) {
      setMessage(content) // restore on failure
      setSending(false)
    } else {
      setSending(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (roomNotFound) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center px-4">
        <AlertCircle size={36} className="text-[#5a6178] mb-4 opacity-60" />
        <p className="text-[#e8eaf0] font-medium mb-1">Room not found</p>
        <p className="text-sm text-[#5a6178] mb-4">This room may have been deleted or doesn't exist.</p>
        <Button variant="secondary" onClick={() => navigate('/rooms')}>Back to Rooms</Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col bg-[#0f1117]" style={{ height: '100dvh' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[#0f1117] border-b border-[#2a3347] flex-shrink-0">
        <button
          onClick={() => navigate('/rooms')}
          className="p-2 rounded-lg hover:bg-[#1e2535] text-[#5a6178] hover:text-[#e8eaf0] transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="w-8 h-8 rounded-lg bg-blue-400/10 flex items-center justify-center flex-shrink-0">
          <Hash size={14} className="text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold text-[#e8eaf0] truncate">{room?.name ?? '...'}</h1>
          {room?.passage_reference && (
            <p className="text-xs text-[#5a6178] flex items-center gap-1">
              <BookOpen size={10} /> {room.passage_reference}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-[#5a6178] flex-shrink-0">
          <Users size={12} />
          {room?.member_count ?? 0}
        </div>
      </div>

      {/* Not a member banner */}
      {!loading && !isMember && (
        <div className="px-4 py-3 bg-[#c8a97e]/10 border-b border-[#c8a97e]/20 flex items-center justify-between gap-3">
          <p className="text-xs text-[#c8a97e]">You are viewing this room. Join to participate in the chat.</p>
          <Button size="sm" onClick={() => navigate('/rooms')}>Join</Button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-[#c8a97e]/30 border-t-[#c8a97e] rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-400/10 flex items-center justify-center mb-4">
              <Hash size={24} className="text-blue-400" />
            </div>
            <p className="text-[#e8eaf0] font-medium mb-1">Welcome to {room?.name}</p>
            <p className="text-sm text-[#5a6178]">
              {isMember ? 'Be the first to say something.' : 'Join this room to participate.'}
            </p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {messages.map((msg, i) => {
              const isOwn = msg.user_id === user?.id
              const prevMsg = messages[i - 1]
              const grouped = prevMsg?.user_id === msg.user_id &&
                new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() < 5 * 60 * 1000

              return (
                <div key={msg.id} className={`flex gap-3 ${grouped ? 'mt-0' : 'mt-5'}`}>
                  {!grouped ? (
                    <Avatar
                      src={msg.profile?.avatar_url}
                      name={msg.profile?.display_name ?? msg.profile?.username ?? 'User'}
                      size="sm"
                    />
                  ) : (
                    <div className="w-8 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    {!grouped && (
                      <div className="flex items-baseline gap-2 mb-0.5">
                        <span className={`text-xs font-semibold ${isOwn ? 'text-[#c8a97e]' : 'text-[#8b92a8]'}`}>
                          {isOwn ? (myProfile?.display_name ?? 'You') : (msg.profile?.display_name ?? msg.profile?.username ?? 'User')}
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
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-4 py-3 bg-[#0f1117] border-t border-[#2a3347] flex-shrink-0">
        {isMember ? (
          <div className="flex items-end gap-2 bg-[#161b27] border border-[#2a3347] rounded-xl px-3 py-2 focus-within:border-[#c8a97e]/40 transition-colors">
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${room?.name ?? ''}...`}
              rows={1}
              className="flex-1 bg-transparent text-sm text-[#e8eaf0] placeholder:text-[#5a6178] outline-none resize-none leading-relaxed"
              style={{ minHeight: '22px', maxHeight: '120px' }}
            />
            <button
              onClick={sendMessage}
              disabled={!message.trim() || sending}
              className="p-1.5 rounded-lg bg-[#c8a97e] hover:bg-[#d4b990] text-[#0f1117] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0 active:scale-95"
            >
              <Send size={14} />
            </button>
          </div>
        ) : (
          <div className="text-center py-1">
            <p className="text-sm text-[#5a6178]">
              <button onClick={() => navigate('/rooms')} className="text-[#c8a97e] hover:underline">Join this room</button> to send messages
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
