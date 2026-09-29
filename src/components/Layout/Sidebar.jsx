import { Bookmark, ChartColumn, ChevronDown, CircleCheck, Coffee, LayoutDashboard } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import { SIDEBAR_SECTIONS } from '../../data/navigation.js'
import useProgressStats from '../../hooks/useProgressStats.js'
import useStudyProgress from '../../hooks/useStudyProgress.js'
import { calculateProgress } from '../../utils/progressUtils.js'

function linkClasses(active) {
  return `flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors ${
    active ? 'bg-indigo-50 font-medium text-indigo-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
  }`
}

function PercentPill({ value }) {
  return (
    <span
      className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums ${
        value === 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
      }`}
    >
      {value}%
    </span>
  )
}

// `onNavigate` lets the mobile menu close itself after a link is clicked.
function Sidebar({ onNavigate }) {
  const location = useLocation()
  const { completedTopics, isCompleted } = useStudyProgress()
  const { interviewPrepPercent } = useProgressStats()
  const [collapsed, setCollapsed] = useState({})

  const currentUrl = location.pathname + location.search
  const isActive = (to) => (to.includes('?') ? currentUrl === to : location.pathname === to)

  const sectionPercent = (section) => {
    if (section.id === 'interview') return interviewPrepPercent
    return calculateProgress(
      section.items.map((item) => item.topicId),
      completedTopics,
    )
  }

  return (
    <div className="flex h-full flex-col">
      <Link to="/" onClick={onNavigate} className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
        <div className="flex size-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
          <Coffee className="size-5" aria-hidden="true" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-bold text-slate-900">Java & Spring Boot</p>
          <p className="text-xs text-slate-500">Interview Preparation</p>
        </div>
      </Link>

      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Main navigation">
        <Link to="/" onClick={onNavigate} className={linkClasses(isActive('/'))}>
          <LayoutDashboard className="size-4" aria-hidden="true" />
          Dashboard
        </Link>

        {SIDEBAR_SECTIONS.map((section) => {
          const isCollapsed = collapsed[section.id]
          return (
            <div key={section.id} className="mt-5">
              <div className="flex items-center gap-1 px-2.5 pb-1">
                <Link
                  to={section.path}
                  onClick={onNavigate}
                  className="flex-1 text-xs font-semibold tracking-wider text-slate-400 uppercase hover:text-indigo-600"
                >
                  {section.title}
                </Link>
                <PercentPill value={sectionPercent(section)} />
                <button
                  type="button"
                  onClick={() => setCollapsed((state) => ({ ...state, [section.id]: !state[section.id] }))}
                  aria-expanded={!isCollapsed}
                  aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} ${section.title}`}
                  className="cursor-pointer rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <ChevronDown className={`size-4 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                </button>
              </div>

              {!isCollapsed && (
                <ul className="space-y-0.5">
                  {section.items.map((item) => {
                    const to = item.to ?? `/topics/${item.topicId}`
                    const done = item.topicId && isCompleted(item.topicId)
                    return (
                      <li key={to}>
                        <Link to={to} onClick={onNavigate} className={linkClasses(isActive(to))}>
                          {item.topicId &&
                            (done ? (
                              <CircleCheck className="size-4 shrink-0 text-emerald-500" aria-label="Completed" />
                            ) : (
                              <span className="flex size-4 shrink-0 items-center justify-center" aria-hidden="true">
                                <span className="size-2.5 rounded-full border-[1.5px] border-slate-300" />
                              </span>
                            ))}
                          <span className="truncate">{item.label}</span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )
        })}

        <div className="mt-5 space-y-0.5 border-t border-slate-200 pt-4">
          <Link to="/bookmarks" onClick={onNavigate} className={linkClasses(isActive('/bookmarks'))}>
            <Bookmark className="size-4" aria-hidden="true" />
            Bookmarks
          </Link>
          <Link to="/progress" onClick={onNavigate} className={linkClasses(isActive('/progress'))}>
            <ChartColumn className="size-4" aria-hidden="true" />
            Progress
          </Link>
        </div>
      </nav>
    </div>
  )
}

export default Sidebar
