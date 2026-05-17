import { NavLink, useNavigate } from 'react-router-dom'
import { BookOpen, Home, Users, Bookmark, Search, LogOut, User, MessageSquare } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Avatar } from '@/components/ui/Avatar'

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/bible', icon: BookOpen, label: 'Bible' },
  { to: '/rooms', icon: Users, label: 'Rooms' },
  { to: '/bookmarks', icon: Bookmark, label: 'Bookmarks' },
  { to: '/search', icon: Search, label: 'Search' },
]

export function Sidebar() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/auth')
  }

  return (
    <aside className="hidden md:flex flex-col w-[72px] lg:w-56 bg-[#0f1117] border-r border-[#2a3347] fixed left-0 top-0 h-full z-30 py-4 transition-all">
      {/* Logo */}
      <div className="px-3 lg:px-4 mb-6">
        <NavLink to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-[#c8a97e]/20 border border-[#c8a97e]/30 flex items-center justify-center flex-shrink-0">
            <BookOpen size={18} className="text-[#c8a97e]" />
          </div>
          <span className="hidden lg:block text-base font-semibold text-[#e8eaf0] font-serif">Ahava</span>
        </NavLink>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 px-2 flex-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group ${
                isActive
                  ? 'bg-[#c8a97e]/15 text-[#c8a97e]'
                  : 'text-[#5a6178] hover:text-[#e8eaf0] hover:bg-[#1e2535]'
              }`
            }
          >
            <Icon size={18} className="flex-shrink-0" />
            <span className="hidden lg:block text-sm font-medium">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="px-2 mt-4 border-t border-[#2a3347] pt-4">
        {user && (
          <>
            <NavLink
              to="/profile"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#1e2535] transition-colors group w-full mb-1"
            >
              <Avatar src={profile?.avatar_url} name={profile?.display_name ?? user.email} size="sm" />
              <div className="hidden lg:flex flex-col min-w-0">
                <span className="text-sm font-medium text-[#e8eaf0] truncate leading-tight">
                  {profile?.display_name ?? 'You'}
                </span>
                <span className="text-xs text-[#5a6178] truncate">{user.email}</span>
              </div>
            </NavLink>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#1e2535] text-[#5a6178] hover:text-[#f87171] transition-colors w-full"
            >
              <LogOut size={18} className="flex-shrink-0" />
              <span className="hidden lg:block text-sm font-medium">Sign Out</span>
            </button>
          </>
        )}
      </div>
    </aside>
  )
}
