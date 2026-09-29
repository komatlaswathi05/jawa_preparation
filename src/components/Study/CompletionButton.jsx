import { Check, RotateCcw } from 'lucide-react'
import useStudyProgress from '../../hooks/useStudyProgress.js'
import Button from '../Common/Button.jsx'

// "Mark as Completed" → saves to localStorage immediately and shows "✓ Completed".
// A completed topic can be undone with "Mark as Incomplete".
function CompletionButton({ topicId, compact = false }) {
  const { isCompleted, markComplete, markIncomplete } = useStudyProgress()

  if (!isCompleted(topicId)) {
    return (
      <Button icon={Check} onClick={() => markComplete(topicId)}>
        {compact ? 'Mark Complete' : 'Mark as Completed'}
      </Button>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="success" icon={Check} onClick={() => markIncomplete(topicId)} title="Click to mark as incomplete">
        Completed
      </Button>
      {!compact && (
        <Button variant="ghost" size="sm" icon={RotateCcw} onClick={() => markIncomplete(topicId)}>
          Mark as Incomplete
        </Button>
      )}
    </div>
  )
}

export default CompletionButton
