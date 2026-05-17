import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'
import { AppLayout } from '@/components/layout/AppLayout'
import { AuthPage } from '@/pages/AuthPage'
import { HomePage } from '@/pages/HomePage'
import { BiblePage } from '@/pages/BiblePage'
import { RoomsPage } from '@/pages/RoomsPage'
import { RoomPage } from '@/pages/RoomPage'
import { BookmarksPage } from '@/pages/BookmarksPage'
import { SearchPage } from '@/pages/SearchPage'
import { ProfilePage } from '@/pages/ProfilePage'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/auth" replace />
  return <>{children}</>
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-2xl bg-[#c8a97e]/15 border border-[#c8a97e]/25 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-[#c8a97e]/30 border-t-[#c8a97e] rounded-full animate-spin" />
        </div>
        <p className="text-sm text-[#5a6178]">Loading Ahava...</p>
      </div>
    </div>
  )
}

function AppRoutes() {
  const { loading } = useAuth()
  if (loading) return <LoadingScreen />

  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/bible" element={<BiblePage />} />
        <Route path="/bible/:book" element={<BiblePage />} />
        <Route path="/bible/:book/:chapter" element={<BiblePage />} />
        <Route path="/rooms" element={<RoomsPage />} />
        <Route path="/rooms/:id" element={<RoomPage />} />
        <Route path="/bookmarks" element={<BookmarksPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  useAuth()

  return (
    <BrowserRouter>
      <AppRoutes />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#161b27',
            color: '#e8eaf0',
            border: '1px solid #2a3347',
            borderRadius: '12px',
            fontSize: '14px',
          },
          success: {
            iconTheme: { primary: '#c8a97e', secondary: '#0f1117' },
          },
          error: {
            iconTheme: { primary: '#f87171', secondary: '#0f1117' },
          },
        }}
      />
    </BrowserRouter>
  )
}
