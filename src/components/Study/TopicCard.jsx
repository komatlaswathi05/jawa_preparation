import { CircleCheck } from 'lucide-react'
import { Link } from 'react-router'
import useStudyProgress from '../../hooks/useStudyProgress.js'
import { DifficultyBadge } from '../Common/Badge.jsx'

function TopicCard({ topic, number }) {
  const { isCompleted } = useStudyProgress()
  const done = isCompleted(topic.id)

  return (
    <Link
      to={`/topics/${topic.id}`}
      className={`group flex flex-col rounded-xl border bg-white p-5 shadow-sm transition-colors hover:border-indigo-300 ${
        done ? 'border-emerald-200' : 'border-slate-200'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-medium text-slate-400">Topic {number}</span>
        {done ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
            <CircleCheck className="size-4" /> Completed
          </span>
        ) : (
          <DifficultyBadge level={topic.difficulty} />
        )}
      </div>
      <h3 className="mt-2 font-semibold text-slate-900 group-hover:text-indigo-700">{topic.title}</h3>
      <p className="mt-1 line-clamp-2 flex-1 text-sm text-slate-500">{topic.description}</p>
      <p className="mt-4 text-xs text-slate-500">
        {topic.subtopics.length} concepts · {topic.interviewQuestions.length} interview questions
      </p>
    </Link>
  )
}

export default TopicCard
