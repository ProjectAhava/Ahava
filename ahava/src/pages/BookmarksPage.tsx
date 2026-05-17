import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bookmark, BookOpen, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { Bookmark as BookmarkType } from '@/types/database'
import { getBookById } from '@/data/bible'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

export function BookmarksPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    loadBookmarks()
  }, [user])

  async function loadBookmarks() {
    setLoading(true)
    const { data } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
    setBookmarks(data ?? [])
    setLoading(false)
  }

  async function removeBookmark(id: string) {
    await supabase.from('bookmarks').delete().eq('id', id)
    setBookmarks(prev => prev.filter(b => b.id !== id))
    toast.success('Bookmark removed')
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="text-center">
          <Bookmark size={40} className="mx-auto text-[#5a6178] mb-4 opacity-40" />
          <p className="text-[#5a6178]">Sign in to see your bookmarks</p>
          <button
            onClick={() => navigate('/auth')}
            className="mt-3 text-sm text-[#c8a97e] hover:underline"
          >
            Sign in
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-serif font-semibold text-[#e8eaf0]">Bookmarks</h1>
        <p className="text-sm text-[#5a6178] mt-1">{bookmarks.length} saved verses</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-[#161b27] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="text-center py-16">
          <Bookmark size={40} className="mx-auto text-[#5a6178] mb-4 opacity-40" />
          <p className="text-[#e8eaf0] font-medium mb-1">No bookmarks yet</p>
          <p className="text-sm text-[#5a6178] mb-4">Tap any verse in the Bible reader to bookmark it</p>
          <button
            onClick={() => navigate('/bible')}
            className="text-sm text-[#c8a97e] hover:underline flex items-center gap-1 mx-auto"
          >
            <BookOpen size={14} /> Open Bible
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {bookmarks.map(bookmark => {
            const bookData = getBookById(bookmark.book)
            return (
              <div
                key={bookmark.id}
                className="flex items-center gap-3 p-4 bg-[#161b27] hover:bg-[#1e2535] border border-[#2a3347] rounded-xl transition-all group cursor-pointer"
                onClick={() => navigate(`/bible/${bookmark.book}/${bookmark.chapter}`)}
              >
                <div className="w-9 h-9 rounded-lg bg-[#c8a97e]/10 flex items-center justify-center flex-shrink-0">
                  <Bookmark size={16} className="text-[#c8a97e] fill-[#c8a97e]/30" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#e8eaf0]">
                    {bookData?.name ?? bookmark.book} {bookmark.chapter}:{bookmark.verse}
                  </p>
                  {bookmark.label && (
                    <p className="text-xs text-[#5a6178] truncate">{bookmark.label}</p>
                  )}
                  <p className="text-xs text-[#5a6178]">
                    {formatDistanceToNow(new Date(bookmark.created_at), { addSuffix: true })}
                  </p>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); removeBookmark(bookmark.id) }}
                  className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-[#f87171]/10 text-[#5a6178] hover:text-[#f87171] transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
