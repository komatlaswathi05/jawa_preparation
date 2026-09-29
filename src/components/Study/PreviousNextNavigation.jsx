import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from 'react-router'
import { getAdjacentTopics } from '../../data/categories.js'
import CompletionButton from './CompletionButton.jsx'

function NavLinkCard({ topic, direction }) {
  const isNext = direction === 'next'
  const Icon = isNext ? ChevronRight : ChevronLeft

  if (!topic) return <div className="hidden flex-1 sm:block" />

  return (
    <Link
      to={`/topics/${topic.id}`}
      className={`group flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-indigo-300 ${
        isNext ? 'flex-row-reverse text-right' : ''
      }`}
    >
      <Icon className="size-5 shrink-0 text-slate-400 group-hover:text-indigo-600" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{isNext ? 'Next Topic' : 'Previous Topic'}</p>
        <p className="truncate font-medium text-slate-800 group-hover:text-indigo-700">{topic.title}</p>
      </div>
    </Link>
  )
}

function PreviousNextNavigation({ topicId }) {
  const { previous, next } = getAdjacentTopics(topicId)

  return (
    <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
      <NavLinkCard topic={previous} direction="previous" />
      <div className="flex justify-center">
        <CompletionButton topicId={topicId} compact />
      </div>
      <NavLinkCard topic={next} direction="next" />
    </div>
  )
}

export default PreviousNextNavigation
