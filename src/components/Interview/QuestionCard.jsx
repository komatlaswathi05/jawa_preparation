import Badge, { DifficultyBadge } from '../Common/Badge.jsx'
import Card from '../Common/Card.jsx'

function QuestionCard({ question, number, total }) {
  return (
    <Card padding="p-5 sm:p-7">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-indigo-600">
          Question {number} / {total}
        </span>
        <DifficultyBadge level={question.difficulty} />
        <Badge>{question.topicTitle}</Badge>
      </div>
      <h2 className="mt-4 text-xl leading-snug font-semibold text-slate-900 sm:text-2xl">{question.question}</h2>
      <p className="mt-3 text-sm text-slate-500">Answer out loud (or write it down) before revealing the answer.</p>
    </Card>
  )
}

export default QuestionCard
