import { BookOpen, Code, Lightbulb, MessageSquare, Search as SearchIcon, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { RESULT_TYPES, search } from '../../utils/searchUtils.js'

const TYPE_ICONS = {
  topic: BookOpen,
  concept: Lightbulb,
  question: MessageSquare,
  coding: Code,
}

// Global search for topics, concepts, interview questions and coding questions.
function Search() {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const containerRef = useRef(null)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  const results = useMemo(() => search(query), [query])

  // Close the dropdown when clicking outside of it.
  useEffect(() => {
    const handleClick = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Press "/" or Ctrl/Cmd + K anywhere to focus the search box.
  useEffect(() => {
    const handleKey = (event) => {
      const typing = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)
      if ((event.key === '/' && !typing) || (event.key === 'k' && (event.metaKey || event.ctrlKey))) {
        event.preventDefault()
        inputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  const goTo = (result) => {
    navigate(result.to)
    setOpen(false)
    setQuery('')
    inputRef.current?.blur()
  }

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((index) => Math.min(index + 1, results.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => Math.max(index - 1, 0))
    } else if (event.key === 'Enter' && results[activeIndex]) {
      goTo(results[activeIndex])
    } else if (event.key === 'Escape') {
      setOpen(false)
      inputRef.current?.blur()
    }
  }

  const showDropdown = open && query.trim().length > 0

  return (
    <div ref={containerRef} className="relative w-full max-w-xl">
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value)
          setActiveIndex(0)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Search topics, questions, coding problems…"
        aria-label="Search study material"
        role="combobox"
        aria-expanded={showDropdown}
        aria-controls="search-results"
        className="h-10 w-full rounded-lg border border-slate-300 bg-slate-50 pr-9 pl-9 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {query ? (
        <button
          type="button"
          onClick={() => {
            setQuery('')
            inputRef.current?.focus()
          }}
          className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer rounded p-1 text-slate-400 hover:text-slate-700"
          aria-label="Clear search"
        >
          <X className="size-4" />
        </button>
      ) : (
        <kbd className="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 rounded border border-slate-300 px-1.5 text-xs text-slate-400 sm:block">
          /
        </kbd>
      )}

      {showDropdown && (
        <div
          id="search-results"
          role="listbox"
          className="absolute top-12 right-0 left-0 z-40 max-h-[70vh] overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-lg"
        >
          {results.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-slate-500">No results for “{query}”.</p>
          ) : (
            results.map((result, index) => {
              const Icon = TYPE_ICONS[result.type]
              const startsGroup = index === 0 || results[index - 1].type !== result.type
              return (
                <div key={`${result.type}-${result.to}`}>
                  {startsGroup && (
                    <p className="px-3 pt-2 pb-1 text-xs font-semibold tracking-wide text-slate-400 uppercase">
                      {RESULT_TYPES[result.type]}
                    </p>
                  )}
                  <button
                    type="button"
                    role="option"
                    aria-selected={index === activeIndex}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => goTo(result)}
                    className={`flex w-full cursor-pointer items-start gap-3 rounded-lg px-3 py-2 text-left ${index === activeIndex ? 'bg-indigo-50' : ''}`}
                  >
                    <Icon className="mt-0.5 size-4 shrink-0 text-slate-400" aria-hidden="true" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-slate-800">{result.title}</span>
                      <span className="block truncate text-xs text-slate-500">{result.subtitle}</span>
                    </span>
                  </button>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

export default Search
