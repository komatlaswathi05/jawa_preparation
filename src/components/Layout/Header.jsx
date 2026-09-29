import { Bookmark, ChartColumn, Flame, Menu } from 'lucide-react'
import { Link } from 'react-router'
import useStudyActivity from '../../hooks/useStudyActivity.js'
import Search from '../Common/Search.jsx'

function Header({ onOpenMenu }) {
  const { currentStreak } = useStudyActivity()

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <button
          type="button"
          onClick={onOpenMenu}
          className="cursor-pointer rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </button>

        <Search />

        <div className="ml-auto flex items-center gap-1">
          <Link
            to="/progress"
            title="Study streak"
            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-semibold ${
              currentStreak > 0 ? 'bg-orange-50 text-orange-600' : 'text-slate-400'
            }`}
          >
            <Flame className="size-4" aria-hidden="true" />
            {currentStreak}
            <span className="sr-only">day study streak</span>
          </Link>
          <Link
            to="/bookmarks"
            className="hidden rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 sm:block"
            title="Bookmarks"
          >
            <Bookmark className="size-5" />
            <span className="sr-only">Bookmarks</span>
          </Link>
          <Link
            to="/progress"
            className="hidden rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 sm:block"
            title="Progress"
          >
            <ChartColumn className="size-5" />
            <span className="sr-only">Progress</span>
          </Link>
        </div>
      </div>
    </header>
  )
}

export default Header
