import { useCallback } from 'react'
import { EMPTY_LIST } from '../utils/progressUtils.js'
import { STORAGE_KEYS } from '../utils/storageUtils.js'
import useLocalStorage from './useLocalStorage.js'

// A bookmark looks like { type: 'topic' | 'question' | 'coding', id: 'java-oop', addedAt: '...' }
export default function useBookmarks() {
  const [bookmarks, setBookmarks] = useLocalStorage(STORAGE_KEYS.BOOKMARKS, EMPTY_LIST)

  const isBookmarked = useCallback(
    (type, id) => bookmarks.some((item) => item.type === type && item.id === id),
    [bookmarks],
  )

  const toggleBookmark = useCallback(
    (type, id) => {
      setBookmarks((current) =>
        current.some((item) => item.type === type && item.id === id)
          ? current.filter((item) => !(item.type === type && item.id === id))
          : [{ type, id, addedAt: new Date().toISOString() }, ...current],
      )
    },
    [setBookmarks],
  )

  return { bookmarks, isBookmarked, toggleBookmark }
}
