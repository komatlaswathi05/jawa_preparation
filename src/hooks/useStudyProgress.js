import { useCallback } from 'react'
import { ALL_TOPIC_IDS } from '../data/categories.js'
import { getCodingQuestionsForTopic } from '../data/codingQuestions.js'
import { STORAGE_KEYS } from '../utils/storageUtils.js'
import {
  calculateProgress,
  EMPTY_MAP,
  markTopicComplete,
  markTopicIncomplete,
  resetProgress,
  setCodingSolved,
  setQuestionReviewed,
} from '../utils/progressUtils.js'
import useLocalStorage from './useLocalStorage.js'

// One hook for everything progress-related. Every component that uses it
// updates immediately when progress changes, because it reads from localStorage.
export default function useStudyProgress() {
  const [completedTopics] = useLocalStorage(STORAGE_KEYS.PROGRESS, EMPTY_MAP)
  const [questionProgress] = useLocalStorage(STORAGE_KEYS.QUESTION_PROGRESS, EMPTY_MAP)
  const [codingProgress] = useLocalStorage(STORAGE_KEYS.CODING_PROGRESS, EMPTY_MAP)

  const isCompleted = useCallback((topicId) => completedTopics[topicId] === true, [completedTopics])

  // Percentage of the given topic ids that are completed (all topics by default).
  const getProgress = useCallback(
    (topicIds = ALL_TOPIC_IDS) => calculateProgress(topicIds, completedTopics),
    [completedTopics],
  )

  const isQuestionReviewed = useCallback((id) => questionProgress[id] === true, [questionProgress])
  const isCodingSolved = useCallback((id) => codingProgress[id] === true, [codingProgress])

  // Progress for a single topic page: 100% once completed, otherwise the share
  // of its interview and coding questions that have been practised.
  const getTopicProgress = useCallback(
    (topic) => {
      if (completedTopics[topic.id] === true) return 100
      const questionIds = topic.interviewQuestions.map((q) => q.id)
      const codingIds = getCodingQuestionsForTopic(topic.id).map((q) => q.id)
      const total = questionIds.length + codingIds.length
      if (total === 0) return 0
      const done =
        questionIds.filter((id) => questionProgress[id] === true).length +
        codingIds.filter((id) => codingProgress[id] === true).length
      return Math.round((done / total) * 100)
    },
    [completedTopics, questionProgress, codingProgress],
  )

  return {
    completedTopics,
    questionProgress,
    codingProgress,
    markComplete: markTopicComplete,
    markIncomplete: markTopicIncomplete,
    isCompleted,
    getProgress,
    getTopicProgress,
    isQuestionReviewed,
    setQuestionReviewed,
    isCodingSolved,
    setCodingSolved,
    resetProgress,
  }
}
