import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Plus, Lock, Globe, ArrowRight, BookOpen } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import type { StudyRoom } from '@/types/database'
import toast from 'react-hot-toast'

export function RoomsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [rooms, setRooms] = useState<StudyRoom[]>([])
  const [myRoomIds, setMyRoomIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', passage_reference: '', is_public: true })

  useEffect(() => {
    loadRooms()
    if (user) loadMyRooms()
  }, [user])

  async function loadRooms() {
    setLoading(true)
    const { data, error } = await supabase
      .from('study_rooms')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
    if (!error) setRooms(data ?? [])
    setLoading(false)
  }

  async function loadMyRooms() {
    const { data } = await supabase
      .from('room_members')
      .select('room_id')
      .eq('user_id', user!.id)
    setMyRoomIds(new Set((data ?? []).map(m => m.room_id)))
  }

  async function createRoom() {
    if (!user || !form.name.trim()) return
    setCreating(true)

    const { data, error } = await supabase
      .from('study_rooms')
      .insert({ ...form, owner_id: user.id, member_count: 1 })
      .select()
      .single()

    if (error) {
      toast.error('Could not create room')
      setCreating(false)
      return
    }

    if (!data) {
      toast.error('Room creation failed: no data returned')
      setCreating(false)
      return
    }

    // Add creator as owner member
    const { error: memberError } = await supabase.from('room_members').insert({
      room_id: data.id,
      user_id: user.id,
      role: 'owner',
    })

    if (memberError) {
      toast.error('Room created but failed to add you as member')
      setCreating(false)
      return
    }

    toast.success('Room created!')
    setShowCreate(false)
    setCreating(false)
    setForm({ name: '', description: '', passage_reference: '', is_public: true })
    navigate(`/rooms/${data.id}`)
  }

  async function joinRoom(roomId: string) {
    if (!user) return

    // Check if already a member (race condition guard)
    const { data: existing } = await supabase
      .from('room_members')
      .select('id')
      .eq('room_id', roomId)
      .eq('user_id', user.id)
      .single()

    if (existing) {
      navigate(`/rooms/${roomId}`)
      return
    }

    const { error } = await supabase
      .from('room_members')
      .insert({ room_id: roomId, user_id: user.id, role: 'member' })

    if (error) {
      toast.error('Could not join room')
      return
    }

    // Increment member count
    await supabase.rpc('increment_member_count', { room_id: roomId }).catch(() => {
      // Fallback: simple update if RPC doesn't exist
      const room = rooms.find(r => r.id === roomId)
      supabase.from('study_rooms')
        .update({ member_count: (room?.member_count ?? 0) + 1 })
        .eq('id', roomId)
    })

    setMyRoomIds(prev => new Set([...prev, roomId]))
    setRooms(prev => prev.map(r => r.id === roomId ? { ...r, member_count: r.member_count + 1 } : r))
    toast.success('Joined room!')
    navigate(`/rooms/${roomId}`)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-[#e8eaf0]">Study Rooms</h1>
          <p className="text-sm text-[#5a6178] mt-1">Join a room or create your own</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={16} />
          New Room
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-[#161b27] rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-16">
          <Users size={40} className="mx-auto text-[#5a6178] mb-4 opacity-40" />
          <p className="text-[#e8eaf0] font-medium mb-1">No rooms yet</p>
          <p className="text-sm text-[#5a6178] mb-4">Be the first to create a study room</p>
          <Button onClick={() => setShowCreate(true)}><Plus size={14} /> Create Room</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {rooms.map(room => {
            const isMember = myRoomIds.has(room.id)
            return (
              <div
                key={room.id}
                className={`bg-[#161b27] border border-[#2a3347] hover:border-[#3a4560] rounded-2xl p-5 flex items-center gap-4 transition-all ${isMember ? 'cursor-pointer' : ''}`}
                onClick={() => isMember && navigate(`/rooms/${room.id}`)}
              >
                <div className="w-11 h-11 rounded-xl bg-blue-400/10 flex items-center justify-center flex-shrink-0">
                  <Users size={18} className="text-blue-400" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-semibold text-[#e8eaf0] text-sm truncate">{room.name}</h3>
                    {room.is_public
                      ? <Globe size={12} className="text-[#5a6178] flex-shrink-0" />
                      : <Lock size={12} className="text-[#5a6178] flex-shrink-0" />
                    }
                  </div>
                  {room.description && (
                    <p className="text-xs text-[#5a6178] truncate mb-1">{room.description}</p>
                  )}
                  <div className="flex items-center gap-3">
                    {room.passage_reference && (
                      <span className="text-xs text-[#c8a97e] flex items-center gap-1">
                        <BookOpen size={10} />{room.passage_reference}
                      </span>
                    )}
                    <span className="text-xs text-[#5a6178]">{room.member_count ?? 0} member{room.member_count !== 1 ? 's' : ''}</span>
                  </div>
                </div>

                {isMember ? (
                  <button
                    onClick={e => { e.stopPropagation(); navigate(`/rooms/${room.id}`) }}
                    className="flex items-center gap-1.5 text-xs font-medium text-[#c8a97e] hover:text-[#d4b990] transition-colors flex-shrink-0"
                  >
                    Open <ArrowRight size={12} />
                  </button>
                ) : (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={e => { e.stopPropagation(); joinRoom(room.id) }}
                  >
                    Join
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Create Room Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Study Room">
        <div className="space-y-4">
          <Input
            label="Room Name *"
            placeholder="e.g. Psalms Morning Study"
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
          />
          <Input
            label="Description"
            placeholder="What will you study?"
            value={form.description}
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
          />
          <Input
            label="Passage"
            placeholder="e.g. Romans 8"
            value={form.passage_reference}
            onChange={e => setForm(p => ({ ...p, passage_reference: e.target.value }))}
          />
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div
              onClick={() => setForm(p => ({ ...p, is_public: !p.is_public }))}
              className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${form.is_public ? 'bg-[#c8a97e]' : 'bg-[#2a3347]'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_public ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-sm text-[#8b92a8]">Make room public</span>
          </label>

          <div className="flex gap-2 pt-1">
            <Button variant="ghost" className="flex-1" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button className="flex-1" loading={creating} onClick={createRoom} disabled={!form.name.trim()}>
              Create Room
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
