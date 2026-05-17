import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'

export function useAuth() {
  const { user, session, profile, loading, reset } = useAuthStore()

  async function signOut() {
    await supabase.auth.signOut()
    reset()
  }

  return { user, session, profile, loading, signOut }
}
