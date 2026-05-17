import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, BookOpen, Bookmark, Edit2, Check, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import toast from 'react-hot-toast'

export function ProfilePage() {
  const { user, profile } = useAuth()
  const { setProfile } = useAuthStore()
  const navigate = useNavigate()

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ display_name: '', bio: '' })
  const [stats, setStats] = useState({ bookmarks: 0, notes: 0, rooms: 0 })

  useEffect(() => {
    if (profile) {
      setForm({ display_name: profile.display_name ?? '', bio: profile.bio ?? '' })
    }
    if (user) loadStats()
  }, [profile, user])

  async function loadStats() {
    const [bookmarkRes, noteRes, roomRes] = await Promise.all([
      supabase.from('bookmarks').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
      supabase.from('shared_notes').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
      supabase.from('room_members').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
    ])
    setStats({
      bookmarks: bookmarkRes.count ?? 0,
      notes: noteRes.count ?? 0,
      rooms: roomRes.count ?? 0,
    })
  }

  async function saveProfile() {
    if (!user) return
    setSaving(true)
    const { data, error } = await supabase
      .from('profiles')
      .update({ display_name: form.display_name.trim() || null, bio: form.bio.trim() || null, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select()
      .single()

    if (error) { toast.error('Could not save profile'); setSaving(false); return }
    setProfile(data)
    setEditing(false)
    setSaving(false)
    toast.success('Profile updated')
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="text-center">
          <User size={40} className="mx-auto text-[#5a6178] mb-4 opacity-40" />
          <p className="text-[#5a6178]">Sign in to view your profile</p>
          <button onClick={() => navigate('/auth')} className="mt-3 text-sm text-[#c8a97e] hover:underline">Sign in</button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Profile card */}
      <div className="bg-[#161b27] border border-[#2a3347] rounded-2xl p-6 mb-6">
        <div className="flex items-start gap-4">
          <Avatar src={profile?.avatar_url} name={profile?.display_name ?? user.email} size="xl" />
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="space-y-3">
                <Input
                  label="Display Name"
                  value={form.display_name}
                  onChange={e => setForm(p => ({ ...p, display_name: e.target.value }))}
                  placeholder="Your name"
                />
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[#8b92a8]">Bio</label>
                  <textarea
                    value={form.bio}
                    onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                    placeholder="A little about you..."
                    className="bg-[#0f1117] border border-[#2a3347] rounded-lg px-3 py-2.5 text-sm text-[#e8eaf0] placeholder:text-[#5a6178] outline-none focus:border-[#c8a97e]/50 resize-none h-20"
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" loading={saving} onClick={saveProfile}>
                    <Check size={14} /> Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                    <X size={14} /> Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-lg font-semibold text-[#e8eaf0]">
                    {profile?.display_name ?? 'New Member'}
                  </h1>
                  <button
                    onClick={() => setEditing(true)}
                    className="p-1.5 rounded-lg hover:bg-[#1e2535] text-[#5a6178] hover:text-[#e8eaf0] transition-colors"
                  >
                    <Edit2 size={13} />
                  </button>
                </div>
                <p className="text-sm text-[#5a6178] mb-2">{user.email}</p>
                {profile?.bio && (
                  <p className="text-sm text-[#8b92a8] leading-relaxed">{profile.bio}</p>
                )}
                {!profile?.bio && (
                  <button
                    onClick={() => setEditing(true)}
                    className="text-xs text-[#5a6178] hover:text-[#c8a97e] transition-colors italic"
                  >
                    Add a bio...
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Bookmarks', value: stats.bookmarks, icon: Bookmark, to: '/bookmarks', color: 'text-[#c8a97e]', bg: 'bg-[#c8a97e]/10' },
          { label: 'Notes', value: stats.notes, icon: Edit2, to: null, color: 'text-purple-400', bg: 'bg-purple-400/10' },
          { label: 'Rooms', value: stats.rooms, icon: User, to: '/rooms', color: 'text-blue-400', bg: 'bg-blue-400/10' },
        ].map(({ label, value, icon: Icon, to, color, bg }) => (
          <button
            key={label}
            onClick={() => to && navigate(to)}
            className="bg-[#161b27] border border-[#2a3347] rounded-xl p-4 text-center hover:border-[#3a4560] transition-all"
          >
            <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center mx-auto mb-2`}>
              <Icon size={16} className={color} />
            </div>
            <p className="text-xl font-bold text-[#e8eaf0]">{value}</p>
            <p className="text-xs text-[#5a6178] mt-0.5">{label}</p>
          </button>
        ))}
      </div>

      {/* Quick links */}
      <div className="bg-[#161b27] border border-[#2a3347] rounded-2xl overflow-hidden">
        {[
          { icon: BookOpen, label: 'Continue Reading', sub: 'Pick up where you left off', to: '/bible', color: 'text-[#c8a97e]' },
          { icon: Bookmark, label: 'My Bookmarks', sub: `${stats.bookmarks} saved verses`, to: '/bookmarks', color: 'text-purple-400' },
        ].map(({ icon: Icon, label, sub, to, color }, i, arr) => (
          <button
            key={to}
            onClick={() => navigate(to)}
            className={`w-full flex items-center gap-3 px-5 py-4 hover:bg-[#1e2535] transition-colors text-left ${
              i < arr.length - 1 ? 'border-b border-[#2a3347]' : ''
            }`}
          >
            <Icon size={18} className={color} />
            <div className="flex-1">
              <p className="text-sm font-medium text-[#e8eaf0]">{label}</p>
              <p className="text-xs text-[#5a6178]">{sub}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
