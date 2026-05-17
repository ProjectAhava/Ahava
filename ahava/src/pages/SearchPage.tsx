import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, BookOpen, ArrowRight } from 'lucide-react'
import { searchVerses, type BibleVerse, BIBLE_BOOKS } from '@/data/bible'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

const POPULAR_SEARCHES = [
  { label: 'John 3:16', query: 'John 3:16' },
  { label: 'Psalm 23', query: 'Psalm 23' },
  { label: 'Romans 8:28', query: 'Romans 8:28' },
  { label: 'Isaiah 40:31', query: 'Isaiah 40:31' },
  { label: 'Jeremiah 29:11', query: 'Jeremiah 29:11' },
  { label: 'Philippians 4:13', query: 'Philippians 4:13' },
]

export function SearchPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<BibleVerse[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState('')

  async function handleSearch(q?: string) {
    const searchQuery = q ?? query
    if (!searchQuery.trim()) return
    setLoading(true)
    setSearched(true)
    setError('')
    setResults([])

    const data = await searchVerses(searchQuery.trim())
    if (data.length === 0) {
      setError('No results found. Try a different reference or passage.')
    }
    setResults(data)
    setLoading(false)
  }

  function getBookName(bookId: string) {
    return BIBLE_BOOKS.find(b => b.id === bookId || b.name.toLowerCase().startsWith(bookId.toLowerCase()))?.name ?? bookId
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-serif font-semibold text-[#e8eaf0] mb-1">Search</h1>
        <p className="text-sm text-[#5a6178]">Search by verse reference or passage</p>
      </div>

      {/* Search input */}
      <div className="flex gap-2 mb-6">
        <div className="flex-1">
          <Input
            icon={<Search size={16} />}
            placeholder="e.g. John 3:16, Psalm 23, Romans 8"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <Button onClick={() => handleSearch()} loading={loading} disabled={!query.trim()}>
          Search
        </Button>
      </div>

      {/* Popular searches */}
      {!searched && (
        <div>
          <p className="text-xs font-semibold text-[#5a6178] uppercase tracking-widest mb-3">Popular</p>
          <div className="flex flex-wrap gap-2">
            {POPULAR_SEARCHES.map(({ label, query: q }) => (
              <button
                key={q}
                onClick={() => { setQuery(q); handleSearch(q) }}
                className="px-3 py-1.5 text-sm bg-[#161b27] hover:bg-[#1e2535] border border-[#2a3347] rounded-lg text-[#8b92a8] hover:text-[#e8eaf0] transition-all"
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-8">
            <p className="text-xs font-semibold text-[#5a6178] uppercase tracking-widest mb-3">Browse by Book</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {BIBLE_BOOKS.slice(0, 12).map(book => (
                <button
                  key={book.id}
                  onClick={() => navigate(`/bible/${book.id}/1`)}
                  className="flex items-center justify-between px-3 py-2 bg-[#161b27] hover:bg-[#1e2535] border border-[#2a3347] rounded-lg text-left transition-all group"
                >
                  <span className="text-sm text-[#8b92a8] group-hover:text-[#e8eaf0] transition-colors">{book.name}</span>
                  <ArrowRight size={12} className="text-[#5a6178] group-hover:text-[#c8a97e] transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-[#161b27] rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {!loading && searched && error && (
        <div className="text-center py-12">
          <Search size={32} className="mx-auto text-[#5a6178] mb-3 opacity-40" />
          <p className="text-[#5a6178]">{error}</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-[#5a6178] uppercase tracking-widest mb-3">{results.length} result{results.length !== 1 ? 's' : ''}</p>
          <div className="space-y-2">
            {results.map((verse, i) => (
              <button
                key={i}
                onClick={() => navigate(`/bible/${verse.book}/${verse.chapter}`)}
                className="w-full text-left p-4 bg-[#161b27] hover:bg-[#1e2535] border border-[#2a3347] rounded-xl transition-all group"
              >
                <p className="text-xs font-medium text-[#c8a97e] mb-2 flex items-center gap-1">
                  <BookOpen size={11} />
                  {getBookName(verse.book)} {verse.chapter}:{verse.verse}
                </p>
                <p className="text-sm font-serif text-[#d4d8e8] leading-relaxed">{verse.text}</p>
                <p className="text-xs text-[#5a6178] mt-2 group-hover:text-[#c8a97e] transition-colors flex items-center gap-1">
                  Read full chapter <ArrowRight size={10} />
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
