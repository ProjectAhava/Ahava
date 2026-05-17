import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Mail, Lock, Eye, EyeOff, User, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/Button'

type Tab = 'signin' | 'signup'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

export function AuthPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    if (user) navigate('/', { replace: true })
  }, [user, navigate])

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password.trim()) return
    setError('')
    setSuccessMsg('')
    setLoading(true)

    if (tab === 'signup') {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: displayName.trim() || undefined },
          emailRedirectTo: window.location.origin,
        },
      })
      if (error) {
        setError(error.message)
      } else {
        setSuccessMsg('Check your email to confirm your account, then sign in.')
        setTab('signin')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (error) setError(error.message)
    }
    setLoading(false)
  }

  async function handleGoogle() {
    setGoogleLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    })
    if (error) {
      setError(error.message)
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center p-4">
      <div className="w-full max-w-[400px]">

        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#c8a97e]/15 border border-[#c8a97e]/25 mb-4">
            <BookOpen size={26} className="text-[#c8a97e]" />
          </div>
          <h1 className="text-2xl font-serif font-semibold text-[#e8eaf0] mb-1.5">Ahava</h1>
          <p className="text-[#5a6178] text-sm">Study the Word together</p>
        </div>

        {/* Card */}
        <div className="bg-[#161b27] border border-[#2a3347] rounded-2xl shadow-2xl overflow-hidden">

          {/* Tabs */}
          <div className="flex border-b border-[#2a3347]">
            {(['signin', 'signup'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(''); setSuccessMsg('') }}
                className={`flex-1 py-3.5 text-sm font-medium transition-colors ${
                  tab === t
                    ? 'text-[#c8a97e] border-b-2 border-[#c8a97e]'
                    : 'text-[#5a6178] hover:text-[#8b92a8]'
                }`}
              >
                {t === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <div className="p-6 space-y-4">
            {/* Google OAuth */}
            <button
              onClick={handleGoogle}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-[#1e2535] hover:bg-[#242d42] border border-[#2a3347] rounded-xl text-sm font-medium text-[#e8eaf0] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {googleLoading ? (
                <div className="w-4 h-4 border-2 border-[#8b92a8]/30 border-t-[#8b92a8] rounded-full animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              Continue with Google
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[#2a3347]" />
              <span className="text-xs text-[#5a6178]">or</span>
              <div className="flex-1 h-px bg-[#2a3347]" />
            </div>

            {/* Error / Success */}
            {error && (
              <div className="flex items-start gap-2 p-3 bg-[#f87171]/10 border border-[#f87171]/20 rounded-xl">
                <AlertCircle size={14} className="text-[#f87171] flex-shrink-0 mt-0.5" />
                <p className="text-xs text-[#f87171] leading-relaxed">{error}</p>
              </div>
            )}
            {successMsg && (
              <div className="flex items-start gap-2 p-3 bg-[#4ade80]/10 border border-[#4ade80]/20 rounded-xl">
                <p className="text-xs text-[#4ade80] leading-relaxed">{successMsg}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleEmailAuth} className="space-y-3">
              {tab === 'signup' && (
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a6178]" />
                  <input
                    type="text"
                    placeholder="Display name (optional)"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    className="w-full bg-[#0f1117] border border-[#2a3347] rounded-xl pl-9 pr-4 py-2.5 text-sm text-[#e8eaf0] placeholder:text-[#5a6178] outline-none focus:border-[#c8a97e]/50 focus:ring-1 focus:ring-[#c8a97e]/15 transition-all"
                  />
                </div>
              )}

              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a6178]" />
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full bg-[#0f1117] border border-[#2a3347] rounded-xl pl-9 pr-4 py-2.5 text-sm text-[#e8eaf0] placeholder:text-[#5a6178] outline-none focus:border-[#c8a97e]/50 focus:ring-1 focus:ring-[#c8a97e]/15 transition-all"
                />
              </div>

              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a6178]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full bg-[#0f1117] border border-[#2a3347] rounded-xl pl-9 pr-10 py-2.5 text-sm text-[#e8eaf0] placeholder:text-[#5a6178] outline-none focus:border-[#c8a97e]/50 focus:ring-1 focus:ring-[#c8a97e]/15 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5a6178] hover:text-[#8b92a8]"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              <Button type="submit" className="w-full" loading={loading}>
                {tab === 'signin' ? 'Sign In' : 'Create Account'}
              </Button>
            </form>
          </div>
        </div>

        <p className="text-center text-xs text-[#5a6178] mt-5">
          By joining, you agree to study with love and respect.
        </p>
      </div>
    </div>
  )
}
