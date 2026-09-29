import { ALL_TOPIC_IDS } from '../data/categories.js'
import { readStorage, removeStorage, STORAGE_KEYS, writeStorage } from './storageUtils.js'

// Shared empty defaults (kept as constants so their identity never changes).
export const EMPTY_MAP = Object.freeze({})
export const EMPTY_LIST = Object.freeze([])

/* ---------------- Topic progress ---------------- */

// Returns an object like { "java-oop": true, "java-strings": false }
export function getProgress() {
  return readStorage(STORAGE_KEYS.PROGRESS, EMPTY_MAP)
}

export function markTopicComplete(topicId) {
  writeStorage(STORAGE_KEYS.PROGRESS, { ...getProgress(), [topicId]: true })
  recordStudyActivity()
}

export function markTopicIncomplete(topicId) {
  writeStorage(STORAGE_KEYS.PROGRESS, { ...getProgress(), [topicId]: false })
}

export function isTopicCompleted(topicId, progress = getProgress()) {
  return progress[topicId] === true
}

// Percentage (0–100) of the given ids that are marked true in `progressMap`.
export function calculateProgress(ids = ALL_TOPIC_IDS, progressMap = getProgress()) {
  if (ids.length === 0) return 0
  const done = ids.filter((id) => progressMap[id] === true).length
  return Math.round((done / ids.length) * 100)
}

export function countCompleted(ids, progressMap) {
  return ids.filter((id) => progressMap[id] === true).length
}

// Clears all study progress. Bookmarks are kept because they are not progress.
export function resetProgress() {
  removeStorage(STORAGE_KEYS.PROGRESS)
  removeStorage(STORAGE_KEYS.CODING_PROGRESS)
  removeStorage(STORAGE_KEYS.QUESTION_PROGRESS)
  removeStorage(STORAGE_KEYS.MOCK_HISTORY)
  removeStorage(STORAGE_KEYS.STUDY_ACTIVITY)
  removeStorage(STORAGE_KEYS.LAST_TOPIC)
}

/* ---------------- Question progress ---------------- */

export function setQuestionReviewed(questionId, reviewed) {
  const current = readStorage(STORAGE_KEYS.QUESTION_PROGRESS, EMPTY_MAP)
  writeStorage(STORAGE_KEYS.QUESTION_PROGRESS, { ...current, [questionId]: reviewed })
  if (reviewed) recordStudyActivity()
}

export function setCodingSolved(questionId, solved) {
  const current = readStorage(STORAGE_KEYS.CODING_PROGRESS, EMPTY_MAP)
  writeStorage(STORAGE_KEYS.CODING_PROGRESS, { ...current, [questionId]: solved })
  if (solved) recordStudyActivity()
}

/* ---------------- Last visited topic ---------------- */

export function setLastTopic(topicId) {
  if (readStorage(STORAGE_KEYS.LAST_TOPIC, null) !== topicId) {
    writeStorage(STORAGE_KEYS.LAST_TOPIC, topicId)
  }
}

/* ---------------- Study activity & streak ---------------- */

// Local date as "YYYY-MM-DD" (not UTC, so late-evening study counts for today).
export function toDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function recordStudyActivity() {
  const activity = readStorage(STORAGE_KEYS.STUDY_ACTIVITY, EMPTY_MAP)
  const today = toDateKey()
  if (!activity[today]) {
    writeStorage(STORAGE_KEYS.STUDY_ACTIVITY, { ...activity, [today]: true })
  }
}

function daysBefore(date, days) {
  const copy = new Date(date)
  copy.setDate(copy.getDate() - days)
  return copy
}

// The streak stays alive until the end of today, so studying yesterday still counts.
export function calculateStreak(activity, today = new Date()) {
  let start = today
  if (!activity[toDateKey(today)]) {
    start = daysBefore(today, 1)
    if (!activity[toDateKey(start)]) return 0
  }
  let streak = 0
  while (activity[toDateKey(daysBefore(start, streak))]) streak++
  return streak
}

export function calculateLongestStreak(activity) {
  const days = Object.keys(activity)
    .filter((key) => activity[key])
    .sort()
  let longest = 0
  let current = 0
  let previous = null
  for (const key of days) {
    const date = new Date(`${key}T00:00:00`)
    const isNextDay = previous && toDateKey(daysBefore(date, 1)) === toDateKey(previous)
    current = isNextDay ? current + 1 : 1
    longest = Math.max(longest, current)
    previous = date
  }
  return longest
}

// Returns the last `count` days (oldest first) with whether the user studied on each.
export function getRecentActivity(activity, count = 28, today = new Date()) {
  return Array.from({ length: count }, (_, index) => {
    const date = daysBefore(today, count - 1 - index)
    const key = toDateKey(date)
    return { key, date, active: Boolean(activity[key]) }
  })
}

/* ---------------- Mock interview history ---------------- */

export function saveMockInterviewResult(result) {
  const history = readStorage(STORAGE_KEYS.MOCK_HISTORY, EMPTY_LIST)
  writeStorage(STORAGE_KEYS.MOCK_HISTORY, [result, ...history].slice(0, 20))
  recordStudyActivity()
}
