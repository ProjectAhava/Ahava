import { useEffect, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import type { Profile } from '@/types/database'

function generateUsername(email: string): string {
  const base = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 16)
  const suffix = Math.floor(1000 + Math.random() * 9000)
  return `${base || 'user'}${suffix}`
}

async function upsertProfile(userId: string, meta?: { full_name?: string; name?: string; avatar_url?: string }): Promise<Profile | null> {
  const { data: existing } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (existing) return existing

  const { data: { user } } = await supabase.auth.getUser()
  const email = user?.email ?? userId
  let username = generateUsername(email)

  for (let attempts = 0; attempts < 5; attempts++) {
    const { data: taken } = await supabase.from('profiles').select('id').eq('username', username).maybeSingle()
    if (!taken) break
    username = generateUsername(email)
  }

  const { data: newProfile } = await supabase.from('profiles').insert({
    id: userId,
    username,
    display_name: meta?.full_name ?? meta?.name ?? null,
    avatar_url: meta?.avatar_url ?? null,
  }).select().maybeSingle()

  return newProfile ?? null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { setUser, setSession, setProfile, setLoading, reset } = useAuthStore()

  useEffect(() => {
    let mounted = true
    setLoading(true)

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        try {
          const profile = await upsertProfile(session.user.id, session.user.user_metadata as { full_name?: string; name?: string; avatar_url?: string })
          if (mounted) setProfile(profile)
        } catch {
          if (mounted) setProfile(null)
        }
      }
      if (mounted) setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return

      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        try {
          const profile = await upsertProfile(session.user.id, session.user.user_metadata as { full_name?: string; name?: string; avatar_url?: string })
          if (mounted) setProfile(profile)
        } catch {
          if (mounted) setProfile(null)
        }
      } else {
        setProfile(null)
        if (mounted) reset()
      }
      if (mounted) setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  return <>{children}</>
}
