import { ALL_TOPIC_IDS, CATEGORIES, getTopicIds } from '../data/categories.js'
import { ALL_CODING_QUESTIONS } from '../data/codingQuestions.js'
import { ALL_INTERVIEW_QUESTIONS } from '../data/interviewQuestions.js'
import { calculateProgress, countCompleted } from '../utils/progressUtils.js'
import useStudyProgress from './useStudyProgress.js'

const INTERVIEW_IDS = ALL_INTERVIEW_QUESTIONS.map((q) => q.id)
const CODING_IDS = ALL_CODING_QUESTIONS.map((q) => q.id)

// Numbers shown on the Dashboard, Progress page and sidebar.
export default function useProgressStats() {
  const { completedTopics, questionProgress, codingProgress } = useStudyProgress()

  const completedTopicCount = countCompleted(ALL_TOPIC_IDS, completedTopics)
  const reviewedQuestionCount = countCompleted(INTERVIEW_IDS, questionProgress)
  const solvedCodingCount = countCompleted(CODING_IDS, codingProgress)
  const practiceTotal = INTERVIEW_IDS.length + CODING_IDS.length

  const categories = CATEGORIES.map((category) => {
    const ids = category.topics.map((topic) => topic.id)
    return {
      ...category,
      total: ids.length,
      completed: countCompleted(ids, completedTopics),
      percent: calculateProgress(ids, completedTopics),
    }
  })

  return {
    overallPercent: calculateProgress(ALL_TOPIC_IDS, completedTopics),
    totalTopics: ALL_TOPIC_IDS.length,
    completedTopics: completedTopicCount,
    remainingTopics: ALL_TOPIC_IDS.length - completedTopicCount,

    totalInterviewQuestions: INTERVIEW_IDS.length,
    reviewedQuestions: reviewedQuestionCount,
    interviewPercent: calculateProgress(INTERVIEW_IDS, questionProgress),

    totalCodingQuestions: CODING_IDS.length,
    solvedCoding: solvedCodingCount,
    codingPercent: calculateProgress(CODING_IDS, codingProgress),

    // Interview preparation = interview questions reviewed + coding questions solved.
    interviewPrepPercent: practiceTotal
      ? Math.round(((reviewedQuestionCount + solvedCodingCount) / practiceTotal) * 100)
      : 0,

    categories,
    percentFor: (categoryIds) => calculateProgress(getTopicIds(categoryIds), completedTopics),
  }
}
