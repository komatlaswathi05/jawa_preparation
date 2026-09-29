import { calculateLongestStreak, calculateStreak, EMPTY_MAP } from '../utils/progressUtils.js'
import { STORAGE_KEYS } from '../utils/storageUtils.js'
import useLocalStorage from './useLocalStorage.js'

// Daily study activity, e.g. { "2026-09-29": true }, plus streaks calculated from it.
export default function useStudyActivity() {
  const [activity] = useLocalStorage(STORAGE_KEYS.STUDY_ACTIVITY, EMPTY_MAP)

  return {
    activity,
    currentStreak: calculateStreak(activity),
    longestStreak: calculateLongestStreak(activity),
    activeDays: Object.values(activity).filter(Boolean).length,
  }
}
