import { getCodingQuestionsForTopic } from '../../data/codingQuestions.js'
import useStudyProgress from '../../hooks/useStudyProgress.js'
import ProgressBar from '../Progress/ProgressBar.jsx'

function TopicProgress({ topic }) {
  const { getTopicProgress, isCompleted, isQuestionReviewed, isCodingSolved } = useStudyProgress()
  const codingQuestions = getCodingQuestionsForTopic(topic.id)
  const reviewed = topic.interviewQuestions.filter((q) => isQuestionReviewed(q.id)).length
  const solved = codingQuestions.filter((q) => isCodingSolved(q.id)).length

  return (
    <div>
      <ProgressBar label="Topic progress" value={getTopicProgress(topic)} />
      <p className="mt-1.5 text-xs text-slate-500">
        {isCompleted(topic.id)
          ? 'Topic completed.'
          : `${reviewed}/${topic.interviewQuestions.length} interview questions reviewed` +
            (codingQuestions.length ? ` · ${solved}/${codingQuestions.length} coding questions solved` : '')}
      </p>
    </div>
  )
}

export default TopicProgress
