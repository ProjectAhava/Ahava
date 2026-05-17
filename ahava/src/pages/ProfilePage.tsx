import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Bookmark, Camera, Check, X, AtSign, Edit2, AlertCircle, LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import toast from 'react-hot-toast'

export function ProfilePage() {
  const { user, profile, signOut } = useAuth()
  const { setProfile } = useAuthStore()
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [usernameError, setUsernameError] = useState('')
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [form, setForm] = useState({
    display_name: '',
    username: '',
    bio: '',
    avatar_url: '',
  })
  const [stats, setStats] = useState({ bookmarks: 0, notes: 0, rooms: 0 })

  useEffect(() => {
    if (profile) {
      setForm({
        display_name: profile.display_name ?? '',
        username: profile.username ?? '',
        bio: profile.bio ?? '',
        avatar_url: profile.avatar_url ?? '',
      })
    }
    if (user) loadStats()
  }, [profile, user])

  async function loadStats() {
    const [bRes, nRes, rRes] = await Promise.all([
      supabase.from('bookmarks').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
      supabase.from('shared_notes').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
      supabase.from('room_members').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
    ])
    setStats({ bookmarks: bRes.count ?? 0, notes: nRes.count ?? 0, rooms: rRes.count ?? 0 })
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return
    if (file.size > 2 * 1024 * 1024) { toast.error('Image must be under 2MB'); return }

    setAvatarUploading(true)
    const ext = file.name.split('.').pop()
    const path = `avatars/${user.id}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true })

    if (uploadError) {
      // Storage not set up — fall back to base64 preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setForm(p => ({ ...p, avatar_url: reader.result as string }))
      }
      reader.readAsDataURL(file)
      toast('Avatar preview set. Save your profile to apply.', { icon: '📷' })
    } else {
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      setForm(p => ({ ...p, avatar_url: data.publicUrl }))
      toast.success('Photo uploaded')
    }
    setAvatarUploading(false)
  }

  async function validateUsername(username: string): Promise<boolean> {
    if (!username) return true // optional
    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
      setUsernameError('3-20 chars: lowercase letters, numbers, underscores only')
      return false
    }
    if (username === profile?.username) return true
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .neq('id', user!.id)
      .single()
    if (data) {
      setUsernameError('This username is already taken')
      return false
    }
    setUsernameError('')
    return true
  }

  async function saveProfile() {
    if (!user) return
    setSaving(true)
    setUsernameError('')

    const valid = await validateUsername(form.username.trim())
    if (!valid) { setSaving(false); return }

    const { data, error } = await supabase
      .from('profiles')
      .update({
        display_name: form.display_name.trim() || null,
        username: form.username.trim() || null,
        bio: form.bio.trim() || null,
        avatar_url: form.avatar_url.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      toast.error('Could not save profile')
      setSaving(false)
      return
    }

    if (!data) {
      toast.error('Profile update failed: no data returned')
      setSaving(false)
      return
    }

    setProfile(data)
    setEditing(false)
    setSaving(false)
    toast.success('Profile updated')
  }

  async function handleSignOut() {
    await signOut()
    navigate('/auth', { replace: true })
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">

      {/* Profile Card */}
      <div className="bg-[#161b27] border border-[#2a3347] rounded-2xl p-6 mb-5">
        <div className="flex items-start gap-5">

          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <Avatar src={form.avatar_url || profile?.avatar_url} name={profile?.display_name ?? user?.email} size="xl" />
            {editing && (
              <>
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={avatarUploading}
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#c8a97e] hover:bg-[#d4b990] text-[#0f1117] flex items-center justify-center shadow-lg transition-all disabled:opa[...]
                >
                  {avatarUploading
                    ? <div className="w-3 h-3 border border-[#0f1117]/40 border-t-[#0f1117] rounded-full animate-spin" />
                    : <Camera size={12} />
                  }
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </>
            )}
          </div>

          {/* Info / Edit form */}
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="space-y-3">
                <Input
                  label="Display Name"
                  value={form.display_name}
                  onChange={e => setForm(p => ({ ...p, display_name: e.target.value }))}
                  placeholder="Your name"
                />
                <div>
                  <Input
                    label="Username"
                    value={form.username}
                    onChange={e => {
                      setForm(p => ({ ...p, username: e.target.value.toLowerCase() }))
                      setUsernameError('')
                    }}
                    onBlur={() => validateUsername(form.username.trim())}
                    placeholder="your_username"
                    icon={<AtSign size={14} />}
                    error={usernameError}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[#8b92a8]">Bio</label>
                  <textarea
                    value={form.bio}
                    onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                    placeholder="A little about you..."
                    maxLength={200}
                    className="bg-[#0f1117] border border-[#2a3347] rounded-xl px-3 py-2.5 text-sm text-[#e8eaf0] placeholder:text-[#5a6178] outline-none focus:border-[#c8a97e]/50 resize-none h-2[...]
                  />
                  <p className="text-xs text-[#5a6178] text-right">{form.bio.length}/200</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" loading={saving} onClick={saveProfile}>
                    <Check size={14} /> Save Changes
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => {
                    setEditing(false)
                    setUsernameError('')
                    if (profile) setForm({
                      display_name: profile.display_name ?? '',
                      username: profile.username ?? '',
                      bio: profile.bio ?? '',
                      avatar_url: profile.avatar_url ?? '',
                    })
                  }}>
                    <X size={14} /> Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h1 className="text-lg font-semibold text-[#e8eaf0] leading-tight">
                    {profile?.display_name ?? 'New Member'}
                  </h1>
                  <button
                    onClick={() => setEditing(true)}
                    className="p-1.5 rounded-lg hover:bg-[#1e2535] text-[#5a6178] hover:text-[#e8eaf0] transition-colors"
                  >
                    <Edit2 size={13} />
                  </button>
                </div>

                {profile?.username && (
                  <p className="text-sm text-[#c8a97e] mb-1 flex items-center gap-1">
                    <AtSign size={12} />{profile.username}
                  </p>
                )}
                <p className="text-xs text-[#5a6178] mb-2">{user?.email}</p>

                {profile?.bio ? (
                  <p className="text-sm text-[#8b92a8] leading-relaxed">{profile.bio}</p>
                ) : (
                  <button
                    onClick={() => setEditing(true)}
                    className="text-xs text-[#5a6178] hover:text-[#c8a97e] transition-colors italic"
                  >
                    Add a bio...
                  </button>
                )}

                {!profile?.username && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-[#c8a97e]/70 bg-[#c8a97e]/5 border border-[#c8a97e]/15 rounded-lg px-3 py-2">
                    <AlertCircle size={12} />
                    Set a username so others can find you
                    <button onClick={() => setEditing(true)} className="ml-1 underline hover:text-[#c8a97e]">Set now</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Bookmarks', value: stats.bookmarks, color: 'text-[#c8a97e]', bg: 'bg-[#c8a97e]/10', to: '/bookmarks' },
          { label: 'Notes', value: stats.notes, color: 'text-purple-400', bg: 'bg-purple-400/10', to: null },
          { label: 'Rooms', value: stats.rooms, color: 'text-blue-400', bg: 'bg-blue-400/10', to: '/rooms' },
        ].map(({ label, value, color, bg, to }) => (
          <button
            key={label}
            onClick={() => to && navigate(to)}
            className={`bg-[#161b27] border border-[#2a3347] rounded-xl p-4 text-center transition-all ${to ? 'hover:border-[#3a4560] cursor-pointer' : 'cursor-default'}`}
          >
            <p className={`text-2xl font-bold ${color} font-serif`}>{value}</p>
            <p className="text-xs text-[#5a6178] mt-0.5">{label}</p>
          </button>
        ))}
      </div>

      {/* Quick links */}
      <div className="bg-[#161b27] border border-[#2a3347] rounded-2xl overflow-hidden mb-5">
        {[
          { icon: BookOpen, label: 'Continue Reading', sub: 'Open the Bible reader', to: '/bible', color: 'text-[#c8a97e]' },
          { icon: Bookmark, label: 'My Bookmarks', sub: `${stats.bookmarks} saved verse${stats.bookmarks !== 1 ? 's' : ''}`, to: '/bookmarks', color: 'text-purple-400' },
        ].map(({ icon: Icon, label, sub, to, color }, i, arr) => (
          <button
            key={to}
            onClick={() => navigate(to)}
            className={`w-full flex items-center gap-3 px-5 py-4 hover:bg-[#1e2535] transition-colors text-left ${i < arr.length - 1 ? 'border-b border-[#2a3347]' : ''}`}
          >
            <Icon size={18} className={color} />
            <div className="flex-1">
              <p className="text-sm font-medium text-[#e8eaf0]">{label}</p>
              <p className="text-xs text-[#5a6178]">{sub}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Sign out */}
      <Button variant="danger" className="w-full" onClick={handleSignOut}>
        <LogOut size={16} /> Sign Out
      </Button>
    </div>
  )
}
