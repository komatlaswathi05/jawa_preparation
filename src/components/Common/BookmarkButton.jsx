import { Bookmark, BookmarkCheck } from 'lucide-react'
import useBookmarks from '../../hooks/useBookmarks.js'

// type: 'topic' | 'question' | 'coding'
function BookmarkButton({ type, id, showLabel = false }) {
  const { isBookmarked, toggleBookmark } = useBookmarks()
  const saved = isBookmarked(type, id)
  const Icon = saved ? BookmarkCheck : Bookmark

  return (
    <button
      type="button"
      onClick={() => toggleBookmark(type, id)}
      aria-pressed={saved}
      title={saved ? 'Remove bookmark' : 'Bookmark'}
      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg text-sm font-medium transition-colors ${
        showLabel ? 'h-10 border px-3' : 'size-8 justify-center'
      } ${
        saved
          ? 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
          : 'border-slate-300 text-slate-500 hover:bg-slate-100 hover:text-slate-800'
      }`}
    >
      <Icon className="size-4" aria-hidden="true" />
      {showLabel ? saved ? 'Bookmarked' : 'Bookmark' : <span className="sr-only">{saved ? 'Remove bookmark' : 'Bookmark'}</span>}
    </button>
  )
}

export default BookmarkButton
