import { ArrowRight, Clock, Trophy } from 'lucide-react'
import { Link } from 'react-router'
import { ALL_TOPICS, getCategory, getTopic } from '../../data/categories.js'
import useLocalStorage from '../../hooks/useLocalStorage.js'
import useStudyProgress from '../../hooks/useStudyProgress.js'
import { STORAGE_KEYS } from '../../utils/storageUtils.js'
import Button from '../Common/Button.jsx'

// Shows the first topic (in curriculum order) that is not completed yet.
function ContinueLearning() {
  const { isCompleted } = useStudyProgress()
  const [lastTopicId] = useLocalStorage(STORAGE_KEYS.LAST_TOPIC, null)

  const nextTopic = ALL_TOPICS.find((topic) => !isCompleted(topic.id))
  const lastTopic = lastTopicId ? getTopic(lastTopicId) : null

  if (!nextTopic) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
        <div className="flex items-center gap-3">
          <Trophy className="size-8 text-emerald-600" />
          <div>
            <h2 className="text-lg font-semibold text-emerald-900">You completed every topic!</h2>
            <p className="text-sm text-emerald-800">Keep sharp with a mock interview or the coding questions.</p>
          </div>
        </div>
        <Button to="/mock-interview" className="mt-4">
          Start a mock interview
        </Button>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-linear-to-br from-indigo-600 to-indigo-700 p-6 text-white shadow-sm">
      <p className="text-sm font-medium text-indigo-200">Continue:</p>
      <h2 className="mt-1 text-2xl font-bold">“{nextTopic.title}”</h2>
      <p className="mt-1 text-sm text-indigo-100">
        {getCategory(nextTopic.category)?.name} · {nextTopic.subtopics.length} concepts
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-4">
        <Link
          to={`/topics/${nextTopic.id}`}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-indigo-700 shadow-sm hover:bg-indigo-50"
        >
          Continue Learning <ArrowRight className="size-4" />
        </Link>
        {lastTopic && lastTopic.id !== nextTopic.id && (
          <Link
            to={`/topics/${lastTopic.id}`}
            className="inline-flex items-center gap-1.5 text-sm text-indigo-100 hover:text-white"
          >
            <Clock className="size-4" /> Last visited: {lastTopic.title}
          </Link>
        )}
      </div>
    </div>
  )
}

export default ContinueLearning
