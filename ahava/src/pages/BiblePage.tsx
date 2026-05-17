import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, BookOpen, Bookmark, Highlighter, StickyNote, X, ChevronDown } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { BIBLE_BOOKS, fetchChapter, type BibleVerse } from '@/data/bible'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'

const HIGHLIGHT_COLORS = [
  { id: 'amber', color: '#f59e0b', bg: 'bg-amber-400/25' },
  { id: 'green', color: '#22c55e', bg: 'bg-green-400/25' },
  { id: 'blue', color: '#3b82f6', bg: 'bg-blue-400/25' },
  { id: 'pink', color: '#ec4899', bg: 'bg-pink-400/25' },
]

export function BiblePage() {
  const { book = 'GEN', chapter = '1' } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [verses, setVerses] = useState<BibleVerse[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedVerse, setSelectedVerse] = useState<BibleVerse | null>(null)
  const [highlights, setHighlights] = useState<Record<string, string>>({})
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set())
  const [noteContent, setNoteContent] = useState('')
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [showBookSelector, setShowBookSelector] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ verse: BibleVerse; x: number; y: number } | null>(null)

  const currentBook = BIBLE_BOOKS.find(b => b.id === book)
  const chapterNum = parseInt(chapter)

  const loadChapter = useCallback(async () => {
    setLoading(true)
    setVerses([])
    const data = await fetchChapter(book, chapterNum)
    setVerses(data)
    setLoading(false)
  }, [book, chapterNum])

  useEffect(() => {
    loadChapter()
  }, [loadChapter])

  useEffect(() => {
    if (!user) return
    supabase
      .from('highlights')
      .select('*')
      .eq('user_id', user.id)
      .eq('book', book)
      .eq('chapter', chapterNum)
      .then(({ data }) => {
        if (data) {
          const map: Record<string, string> = {}
          data.forEach(h => { map[`${h.verse}`] = h.color })
          setHighlights(map)
        }
      })

    supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', user.id)
      .eq('book', book)
      .eq('chapter', chapterNum)
      .then(({ data }) => {
        if (data) setBookmarks(new Set(data.map(b => `${b.verse}`)))
      })
  }, [user, book, chapterNum])

  async function handleHighlight(verse: BibleVerse, color: string) {
    if (!user) { toast.error('Sign in to highlight'); return }
    const key = `${verse.verse}`
    const existing = highlights[key]

    if (existing === color) {
      await supabase.from('highlights').delete()
        .eq('user_id', user.id).eq('book', book).eq('chapter', chapterNum).eq('verse', verse.verse)
      setHighlights(prev => { const n = { ...prev }; delete n[key]; return n })
    } else {
      await supabase.from('highlights').upsert({
        user_id: user.id, book, chapter: chapterNum, verse: verse.verse, color,
      }, { onConflict: 'user_id,book,chapter,verse' })
      setHighlights(prev => ({ ...prev, [key]: color }))
    }
    setContextMenu(null)
  }

  async function handleBookmark(verse: BibleVerse) {
    if (!user) { toast.error('Sign in to bookmark'); return }
    const key = `${verse.verse}`

    if (bookmarks.has(key)) {
      await supabase.from('bookmarks').delete()
        .eq('user_id', user.id).eq('book', book).eq('chapter', chapterNum).eq('verse', verse.verse)
      setBookmarks(prev => { const n = new Set(prev); n.delete(key); return n })
      toast.success('Bookmark removed')
    } else {
      await supabase.from('bookmarks').insert({
        user_id: user.id, book, chapter: chapterNum, verse: verse.verse,
      })
      setBookmarks(prev => new Set([...prev, key]))
      toast.success('Verse bookmarked')
    }
    setContextMenu(null)
  }

  async function handleSaveNote() {
    if (!user || !selectedVerse || !noteContent.trim()) return
    await supabase.from('shared_notes').insert({
      user_id: user.id,
      book,
      chapter: chapterNum,
      verse: selectedVerse.verse,
      content: noteContent.trim(),
      is_public: true,
    })
    toast.success('Note saved')
    setNoteContent('')
    setShowNoteModal(false)
    setContextMenu(null)
  }

  function navigateChapter(delta: number) {
    const newChapter = chapterNum + delta
    if (newChapter < 1) {
      const bookIdx = BIBLE_BOOKS.findIndex(b => b.id === book)
      if (bookIdx > 0) {
        const prev = BIBLE_BOOKS[bookIdx - 1]
        navigate(`/bible/${prev.id}/${prev.chapters}`)
      }
    } else if (currentBook && newChapter > currentBook.chapters) {
      const bookIdx = BIBLE_BOOKS.findIndex(b => b.id === book)
      if (bookIdx < BIBLE_BOOKS.length - 1) {
        navigate(`/bible/${BIBLE_BOOKS[bookIdx + 1].id}/1`)
      }
    } else {
      navigate(`/bible/${book}/${newChapter}`)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6" onClick={() => setContextMenu(null)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 sticky top-0 bg-[#0f1117]/95 backdrop-blur-sm py-3 -mx-4 px-4 z-10 border-b border-[#2a3347]">
        <button
          onClick={() => setShowBookSelector(true)}
          className="flex items-center gap-2 text-[#e8eaf0] hover:text-[#c8a97e] transition-colors"
        >
          <h1 className="text-lg font-serif font-semibold">
            {currentBook?.name ?? book} {chapterNum}
          </h1>
          <ChevronDown size={16} />
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateChapter(-1)}
            className="p-2 rounded-lg hover:bg-[#1e2535] text-[#5a6178] hover:text-[#e8eaf0] transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-xs text-[#5a6178] min-w-[3rem] text-center">
            {chapterNum}/{currentBook?.chapters}
          </span>
          <button
            onClick={() => navigateChapter(1)}
            className="p-2 rounded-lg hover:bg-[#1e2535] text-[#5a6178] hover:text-[#e8eaf0] transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Verses */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-5 bg-[#1e2535] rounded" style={{ width: `${60 + Math.random() * 40}%` }} />
          ))}
        </div>
      ) : verses.length === 0 ? (
        <div className="text-center py-16 text-[#5a6178]">
          <BookOpen size={32} className="mx-auto mb-3 opacity-40" />
          <p>Unable to load this chapter. Check your connection.</p>
          <Button variant="secondary" size="sm" className="mt-4" onClick={loadChapter}>Retry</Button>
        </div>
      ) : (
        <div className="space-y-1 pb-20">
          {verses.map((verse) => {
            const key = `${verse.verse}`
            const highlightColor = highlights[key]
            const isBookmarked = bookmarks.has(key)

            return (
              <div
                key={verse.verse}
                onContextMenu={(e) => {
                  e.preventDefault()
                  setContextMenu({ verse, x: e.clientX, y: e.clientY })
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  setContextMenu({ verse, x: e.clientX, y: e.clientY })
                }}
                className={`group relative flex gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all duration-150 hover:bg-[#161b27] ${
                  highlightColor ? `border-l-2` : ''
                }`}
                style={highlightColor ? { borderLeftColor: highlightColor, paddingLeft: '10px' } : {}}
              >
                <span className="text-xs font-mono text-[#5a6178] pt-1 select-none w-6 flex-shrink-0 text-right">
                  {verse.verse}
                </span>
                <p
                  className="font-serif text-[#d4d8e8] leading-[1.85] text-[1.05rem]"
                  style={highlightColor ? { color: '#e8eaf0' } : {}}
                >
                  {verse.text}
                </p>
                {isBookmarked && (
                  <Bookmark size={12} className="absolute top-2 right-2 text-[#c8a97e] fill-[#c8a97e] flex-shrink-0" />
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-[#161b27] border border-[#2a3347] rounded-xl shadow-2xl p-2 min-w-[180px]"
          style={{
            top: Math.min(contextMenu.y, window.innerHeight - 200),
            left: Math.min(contextMenu.x, window.innerWidth - 200),
          }}
          onClick={e => e.stopPropagation()}
        >
          <p className="text-xs text-[#5a6178] px-3 py-1.5 border-b border-[#2a3347] mb-1">
            Verse {contextMenu.verse.verse}
          </p>

          {/* Highlight */}
          <div className="px-3 py-2">
            <p className="text-xs text-[#5a6178] mb-2">Highlight</p>
            <div className="flex gap-2">
              {HIGHLIGHT_COLORS.map(({ id, color }) => (
                <button
                  key={id}
                  onClick={() => handleHighlight(contextMenu.verse, color)}
                  className="w-6 h-6 rounded-full border-2 transition-all hover:scale-110"
                  style={{
                    backgroundColor: color,
                    borderColor: highlights[`${contextMenu.verse.verse}`] === color ? '#fff' : 'transparent',
                  }}
                />
              ))}
            </div>
          </div>

          <button
            onClick={() => handleBookmark(contextMenu.verse)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#1e2535] text-sm text-[#8b92a8] hover:text-[#e8eaf0] transition-colors"
          >
            <Bookmark size={14} />
            {bookmarks.has(`${contextMenu.verse.verse}`) ? 'Remove bookmark' : 'Bookmark verse'}
          </button>

          <button
            onClick={() => { setSelectedVerse(contextMenu.verse); setShowNoteModal(true); setContextMenu(null) }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#1e2535] text-sm text-[#8b92a8] hover:text-[#e8eaf0] transition-colors"
          >
            <StickyNote size={14} />
            Add note
          </button>

          <button
            onClick={() => setContextMenu(null)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#1e2535] text-sm text-[#5a6178] transition-colors"
          >
            <X size={14} />
            Close
          </button>
        </div>
      )}

      {/* Note Modal */}
      {showNoteModal && selectedVerse && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowNoteModal(false)} />
          <div className="relative w-full max-w-lg bg-[#161b27] border border-[#2a3347] rounded-2xl p-5 shadow-2xl">
            <h3 className="text-sm font-semibold text-[#e8eaf0] mb-1">Note on {currentBook?.name} {chapterNum}:{selectedVerse.verse}</h3>
            <p className="text-xs text-[#5a6178] mb-4 italic font-serif">{selectedVerse.text.slice(0, 80)}...</p>
            <textarea
              value={noteContent}
              onChange={e => setNoteContent(e.target.value)}
              placeholder="Write your reflection..."
              className="w-full bg-[#0f1117] border border-[#2a3347] rounded-xl px-4 py-3 text-sm text-[#e8eaf0] placeholder:text-[#5a6178] outline-none focus:border-[#c8a97e]/50 resize-none h-32"
              autoFocus
            />
            <div className="flex gap-2 mt-3 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setShowNoteModal(false)}>Cancel</Button>
              <Button size="sm" onClick={handleSaveNote} disabled={!noteContent.trim()}>Save Note</Button>
            </div>
          </div>
        </div>
      )}

      {/* Book Selector Modal */}
      {showBookSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowBookSelector(false)} />
          <div className="relative w-full max-w-2xl bg-[#161b27] border border-[#2a3347] rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-[#2a3347] flex items-center justify-between">
              <h2 className="font-semibold text-[#e8eaf0]">Choose a Book</h2>
              <button onClick={() => setShowBookSelector(false)} className="p-1.5 hover:bg-[#1e2535] rounded-lg text-[#5a6178]"><X size={16} /></button>
            </div>
            <div className="overflow-y-auto p-4">
              {['OT', 'NT'].map(testament => (
                <div key={testament} className="mb-6">
                  <p className="text-xs font-semibold text-[#5a6178] uppercase tracking-widest mb-3">
                    {testament === 'OT' ? 'Old Testament' : 'New Testament'}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {BIBLE_BOOKS.filter(b => b.testament === testament).map(b => (
                      <button
                        key={b.id}
                        onClick={() => { navigate(`/bible/${b.id}/1`); setShowBookSelector(false) }}
                        className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          b.id === book
                            ? 'bg-[#c8a97e]/15 text-[#c8a97e]'
                            : 'text-[#8b92a8] hover:bg-[#1e2535] hover:text-[#e8eaf0]'
                        }`}
                      >
                        {b.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
