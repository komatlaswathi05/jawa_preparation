// All localStorage keys used by the app live here.
export const STORAGE_KEYS = {
  PROGRESS: 'javaSpringStudyProgress',
  CODING_PROGRESS: 'javaCodingProgress',
  QUESTION_PROGRESS: 'interviewQuestionProgress',
  MOCK_HISTORY: 'mockInterviewHistory',
  STUDY_ACTIVITY: 'studyActivity',
  LAST_TOPIC: 'lastStudyTopic',
  BOOKMARKS: 'studyBookmarks',
}

const CHANGE_EVENT = 'study-storage-change'

// Parsed values are cached so React receives the same object until the stored value changes.
const cache = new Map()

export function readStorage(key, fallback) {
  let raw = null
  try {
    raw = window.localStorage.getItem(key)
  } catch {
    // localStorage can be unavailable (private mode, blocked storage). Fall back to defaults.
  }

  const cached = cache.get(key)
  if (cached && cached.raw === raw) return cached.value

  let value = fallback
  if (raw !== null) {
    try {
      value = JSON.parse(raw)
    } catch {
      value = fallback
    }
  }
  cache.set(key, { raw, value })
  return value
}

export function writeStorage(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Ignore quota or privacy errors; the UI keeps working for this session.
  }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: key }))
}

export function removeStorage(key) {
  try {
    window.localStorage.removeItem(key)
  } catch {
    // Ignore
  }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: key }))
}

// Calls `callback` whenever a stored value changes in this tab or in another tab.
export function subscribeToStorage(callback) {
  window.addEventListener(CHANGE_EVENT, callback)
  window.addEventListener('storage', callback)
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback)
    window.removeEventListener('storage', callback)
  }
}
