import { useCallback, useSyncExternalStore } from 'react'
import { readStorage, subscribeToStorage, writeStorage } from '../utils/storageUtils.js'

// Reads a JSON value from localStorage and re-renders whenever it changes
// (from any component in this tab, or from another browser tab).
// `fallback` should be a constant so it keeps the same identity between renders.
export default function useLocalStorage(key, fallback) {
  const value = useSyncExternalStore(
    subscribeToStorage,
    () => readStorage(key, fallback),
    () => fallback,
  )

  const setValue = useCallback(
    (next) => {
      const current = readStorage(key, fallback)
      writeStorage(key, typeof next === 'function' ? next(current) : next)
    },
    [key, fallback],
  )

  return [value, setValue]
}
