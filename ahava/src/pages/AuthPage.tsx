import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { BookOpen } from 'lucide-react'

export function AuthPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) navigate('/')
  }, [user, navigate])

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#c8a97e]/15 border border-[#c8a97e]/25 mb-5">
            <BookOpen size={28} className="text-[#c8a97e]" />
          </div>
          <h1 className="text-3xl font-serif font-semibold text-[#e8eaf0] mb-2">Ahava</h1>
          <p className="text-[#5a6178] text-sm leading-relaxed">
            Study the Word together. <br />
            A place for shared reflection and community.
          </p>
        </div>

        {/* Auth card */}
        <div className="bg-[#161b27] border border-[#2a3347] rounded-2xl p-6 shadow-2xl">
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#c8a97e',
                    brandAccent: '#d4b990',
                    brandButtonText: '#0f1117',
                    defaultButtonBackground: '#1e2535',
                    defaultButtonBackgroundHover: '#242d42',
                    defaultButtonBorder: '#2a3347',
                    defaultButtonText: '#e8eaf0',
                    dividerBackground: '#2a3347',
                    inputBackground: '#0f1117',
                    inputBorder: '#2a3347',
                    inputBorderHover: '#c8a97e',
                    inputBorderFocus: '#c8a97e',
                    inputText: '#e8eaf0',
                    inputLabelText: '#8b92a8',
                    inputPlaceholder: '#5a6178',
                    messageText: '#8b92a8',
                    messageTextDanger: '#f87171',
                    anchorTextColor: '#c8a97e',
                    anchorTextHoverColor: '#d4b990',
                  },
                  radii: {
                    borderRadiusButton: '10px',
                    buttonBorderRadius: '10px',
                    inputBorderRadius: '10px',
                  },
                  fonts: {
                    bodyFontFamily: `'Inter', sans-serif`,
                    buttonFontFamily: `'Inter', sans-serif`,
                    inputFontFamily: `'Inter', sans-serif`,
                    labelFontFamily: `'Inter', sans-serif`,
                  },
                  fontSizes: {
                    baseBodySize: '14px',
                    baseInputSize: '14px',
                    baseLabelSize: '13px',
                    baseButtonSize: '14px',
                  },
                },
              },
            }}
            providers={['google']}
            redirectTo={window.location.origin}
          />
        </div>

        <p className="text-center text-xs text-[#5a6178] mt-6">
          By signing in, you agree to study with love and respect.
        </p>
      </div>
    </div>
  )
}
