import { useNavigate } from 'react-router-dom'
import { BookOpen, Users, Bookmark, ArrowRight, Search } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { BIBLE_BOOKS } from '@/data/bible'

const quickVerses = [
  { ref: 'John 3:16', book: 'JHN', chapter: 3, text: 'For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life.' },
  { ref: 'Psalm 23:1', book: 'PSA', chapter: 23, text: 'The Lord is my shepherd; I shall not want.' },
  { ref: 'Romans 8:28', book: 'ROM', chapter: 8, text: 'And we know that for those who love God all things work together for good.' },
  { ref: 'Philippians 4:13', book: 'PHP', chapter: 4, text: 'I can do all things through him who strengthens me.' },
]

export function HomePage() {
  const { profile, user } = useAuth()
  const navigate = useNavigate()

  const displayName = profile?.display_name ?? user?.email?.split('@')[0] ?? 'friend'
  const otCount = BIBLE_BOOKS.filter(b => b.testament === 'OT').length
  const ntCount = BIBLE_BOOKS.filter(b => b.testament === 'NT').length

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Greeting */}
      <div className="mb-10">
        <p className="text-[#5a6178] text-sm mb-1">Welcome back,</p>
        <h1 className="text-2xl font-serif font-semibold text-[#e8eaf0]">{displayName}</h1>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        {[
          { icon: BookOpen, label: 'Read Bible', color: 'text-[#c8a97e]', bg: 'bg-[#c8a97e]/10', to: '/bible' },
          { icon: Users, label: 'Study Rooms', color: 'text-blue-400', bg: 'bg-blue-400/10', to: '/rooms' },
          { icon: Bookmark, label: 'Bookmarks', color: 'text-purple-400', bg: 'bg-purple-400/10', to: '/bookmarks' },
          { icon: Search, label: 'Search Verses', color: 'text-green-400', bg: 'bg-green-400/10', to: '/search' },
        ].map(({ icon: Icon, label, color, bg, to }) => (
          <button
            key={to}
            onClick={() => navigate(to)}
            className="flex flex-col items-center gap-3 p-5 bg-[#161b27] hover:bg-[#1e2535] border border-[#2a3347] hover:border-[#3a4560] rounded-2xl transition-all duration-150 group"
          >
            <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center`}>
              <Icon size={20} className={color} />
            </div>
            <span className="text-sm font-medium text-[#8b92a8] group-hover:text-[#e8eaf0] transition-colors text-center leading-tight">{label}</span>
          </button>
        ))}
      </div>

      {/* Featured verse */}
      <div className="mb-8">
        <h2 className="text-xs font-semibold text-[#5a6178] uppercase tracking-widest mb-4">Verse of the Day</h2>
        <div className="bg-gradient-to-br from-[#c8a97e]/10 to-[#161b27] border border-[#c8a97e]/20 rounded-2xl p-6">
          <blockquote className="font-serif text-lg text-[#e8eaf0] leading-relaxed italic mb-3">
            "{quickVerses[new Date().getDate() % quickVerses.length].text}"
          </blockquote>
          <p className="text-sm text-[#c8a97e]">— {quickVerses[new Date().getDate() % quickVerses.length].ref}</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-4"
            onClick={() => {
              const v = quickVerses[new Date().getDate() % quickVerses.length]
              navigate(`/bible/${v.book}/${v.chapter}`)
            }}
          >
            Read chapter <ArrowRight size={14} />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: 'OT Books', value: otCount },
          { label: 'NT Books', value: ntCount },
          { label: 'Total Chapters', value: BIBLE_BOOKS.reduce((s, b) => s + b.chapters, 0) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-[#161b27] border border-[#2a3347] rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-[#c8a97e] font-serif">{value}</p>
            <p className="text-xs text-[#5a6178] mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Recent books */}
      <div>
        <h2 className="text-xs font-semibold text-[#5a6178] uppercase tracking-widest mb-4">Start Reading</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[...BIBLE_BOOKS.slice(0, 3), ...BIBLE_BOOKS.slice(39, 42)].map((book) => (
            <button
              key={book.id}
              onClick={() => navigate(`/bible/${book.id}/1`)}
              className="flex items-center justify-between px-4 py-3 bg-[#161b27] hover:bg-[#1e2535] border border-[#2a3347] hover:border-[#3a4560] rounded-xl transition-all text-left group"
            >
              <div>
                <p className="text-sm font-medium text-[#e8eaf0]">{book.name}</p>
                <p className="text-xs text-[#5a6178]">{book.chapters} chapters</p>
              </div>
              <ArrowRight size={14} className="text-[#5a6178] group-hover:text-[#c8a97e] transition-colors" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
