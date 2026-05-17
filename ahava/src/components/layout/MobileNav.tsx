import { NavLink } from 'react-router-dom'
import { Home, BookOpen, Users, Bookmark, Search } from 'lucide-react'

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/bible', icon: BookOpen, label: 'Bible' },
  { to: '/rooms', icon: Users, label: 'Rooms' },
  { to: '/bookmarks', icon: Bookmark, label: 'Saved' },
  { to: '/search', icon: Search, label: 'Search' },
]

export function MobileNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#0f1117]/95 backdrop-blur-md border-t border-[#2a3347] px-2 pb-safe">
      <div className="flex items-center justify-around py-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all ${
                isActive ? 'text-[#c8a97e]' : 'text-[#5a6178]'
              }`
            }
          >
            <Icon size={20} />
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
