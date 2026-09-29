import { Check, Clock } from 'lucide-react'
import { useState } from 'react'
import useStudyProgress from '../../hooks/useStudyProgress.js'
import Accordion from '../Common/Accordion.jsx'
import Badge, { DifficultyBadge } from '../Common/Badge.jsx'
import BookmarkButton from '../Common/BookmarkButton.jsx'
import Button from '../Common/Button.jsx'
import CodeBlock from '../Common/CodeBlock.jsx'
import RichText from '../Common/RichText.jsx'

function Example({ label, value }) {
  return (
    <div className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="mb-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">{label}</p>
      <pre className="overflow-x-auto font-mono text-[13px] whitespace-pre-wrap text-slate-800">{value}</pre>
    </div>
  )
}

// A coding problem. The solution stays hidden until the learner asks for it.
function CodingQuestion({ question, index, defaultOpen = false, showCategory = false }) {
  const { isCodingSolved, setCodingSolved } = useStudyProgress()
  const [showSolution, setShowSolution] = useState(false)
  const solved = isCodingSolved(question.id)

  const header = (
    <>
      <p className="font-medium text-slate-900">
        {index !== undefined && <span className="mr-1.5 text-slate-400">{index + 1}.</span>}
        {question.title}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <DifficultyBadge level={question.difficulty} />
        {showCategory && <Badge>{question.category}</Badge>}
        {solved && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
            <Check className="size-3.5" /> Solved
          </span>
        )}
      </div>
    </>
  )

  const isSql = question.category === 'SQL'

  return (
    <Accordion
      id={question.id}
      header={header}
      defaultOpen={defaultOpen}
      highlighted={defaultOpen}
      actions={<BookmarkButton type="coding" id={question.id} />}
    >
      <div className="space-y-4 text-slate-700">
        <div>
          <h4 className="mb-1.5 text-sm font-semibold text-slate-900">Problem</h4>
          <RichText text={question.problem} />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Example label="Example input" value={question.input} />
          <Example label="Example output" value={question.output} />
        </div>

        {showSolution ? (
          <>
            <div>
              <h4 className="mb-1.5 text-sm font-semibold text-slate-900">Explanation</h4>
              <RichText text={question.explanation} />
            </div>
            <CodeBlock code={question.solution} label={isSql ? 'SQL solution' : 'Java solution'} />
            <p className="flex items-center gap-1.5 text-sm text-slate-600">
              <Clock className="size-4 text-slate-400" />
              <span className="font-medium text-slate-800">Complexity:</span> {question.complexity}
            </p>
          </>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 p-4 text-center">
            <p className="mb-3 text-sm text-slate-500">Try solving it yourself first, then check the solution.</p>
            <Button variant="secondary" size="sm" onClick={() => setShowSolution(true)}>
              Show solution
            </Button>
          </div>
        )}

        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={solved}
            onChange={(event) => setCodingSolved(question.id, event.target.checked)}
            className="size-4 cursor-pointer accent-emerald-600"
          />
          I solved this problem
        </label>
      </div>
    </Accordion>
  )
}

export default CodingQuestion
