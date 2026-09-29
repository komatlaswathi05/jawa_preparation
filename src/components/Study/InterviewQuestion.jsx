import { Check } from 'lucide-react'
import { Link } from 'react-router'
import useStudyProgress from '../../hooks/useStudyProgress.js'
import Accordion from '../Common/Accordion.jsx'
import { DifficultyBadge } from '../Common/Badge.jsx'
import BookmarkButton from '../Common/BookmarkButton.jsx'
import CodeBlock from '../Common/CodeBlock.jsx'
import KeyPoints from '../Common/KeyPoints.jsx'
import RichText from '../Common/RichText.jsx'

// One interview question: question in the header, answer / example / key points when expanded.
function InterviewQuestion({ question, index, defaultOpen = false, showTopic = false }) {
  const { isQuestionReviewed, setQuestionReviewed } = useStudyProgress()
  const reviewed = isQuestionReviewed(question.id)

  const header = (
    <>
      <p className="font-medium text-slate-900">
        {index !== undefined && <span className="mr-1.5 text-slate-400">{index + 1}.</span>}
        {question.question}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <DifficultyBadge level={question.difficulty} />
        {showTopic && question.topicTitle && <span className="text-xs text-slate-500">{question.topicTitle}</span>}
        {reviewed && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
            <Check className="size-3.5" /> Reviewed
          </span>
        )}
      </div>
    </>
  )

  return (
    <Accordion
      id={question.id}
      header={header}
      defaultOpen={defaultOpen}
      highlighted={defaultOpen}
      actions={<BookmarkButton type="question" id={question.id} />}
    >
      <div className="space-y-4 text-slate-700">
        <div>
          <h4 className="mb-1.5 text-sm font-semibold text-slate-900">Answer</h4>
          <RichText text={question.answer} />
        </div>

        {question.example && <CodeBlock code={question.example} />}

        <KeyPoints points={question.points} />

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={reviewed}
              onChange={(event) => setQuestionReviewed(question.id, event.target.checked)}
              className="size-4 cursor-pointer accent-emerald-600"
            />
            I can answer this question
          </label>
          {showTopic && question.topicId && (
            <Link to={`/topics/${question.topicId}`} className="text-sm font-medium text-indigo-600 hover:underline">
              Study the topic →
            </Link>
          )}
        </div>
      </div>
    </Accordion>
  )
}

export default InterviewQuestion
