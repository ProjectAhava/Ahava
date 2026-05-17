import { useEffect, createContext, useContext, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import type { Profile } from '@/types/database'

const AuthContext = createContext<null>(null)

function generateUsername(email: string): string {
  const base = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 16)
  const suffix = Math.floor(1000 + Math.random() * 9000)
  return `${base || 'user'}${suffix}`
}

async function upsertProfile(userId: string, meta?: { full_name?: string; name?: string; avatar_url?: string }): Promise<Profile | null> {
  // Check if profile exists
  const { data: existing } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (existing) return existing

  // Get user email for username generation
  const { data: { user } } = await supabase.auth.getUser()
  const email = user?.email ?? userId

  // Generate unique username
  let username = generateUsername(email)
  let attempts = 0
  while (attempts < 5) {
    const { data: taken } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single()
    if (!taken) break
    username = generateUsername(email)
    attempts++
  }

  const { data: newProfile } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      username,
      display_name: meta?.full_name ?? meta?.name ?? null,
      avatar_url: meta?.avatar_url ?? null,
    })
    .select()
    .single()

  return newProfile
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { setUser, setSession, setProfile, setLoading, reset } = useAuthStore()

  useEffect(() => {
    let mounted = true

    // Initialize session on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        try {
          const profile = await upsertProfile(
            session.user.id,
            session.user.user_metadata as { full_name?: string; name?: string; avatar_url?: string }
          )
          if (mounted) setProfile(profile)
        } catch (_) {}
      }
      if (mounted) setLoading(false)
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        try {
          const profile = await upsertProfile(
            session.user.id,
            session.user.user_metadata as { full_name?: string; name?: string; avatar_url?: string }
          )
          if (mounted) setProfile(profile)
        } catch (_) {}
      } else {
        setProfile(null)
        if (event === 'SIGNED_OUT') reset()
      }
      if (mounted) setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  return <AuthContext.Provider value={null}>{children}</AuthContext.Provider>
}
