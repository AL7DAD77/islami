'use client'

import { useSyncExternalStore } from 'react'

export interface Bookmark {
  id: string
  surah: number
  surahName: string
  page: number
  createdAt: number
}

export interface ReadingPosition {
  surah: number
  surahName: string
  page: number
  updatedAt: number
}

interface State {
  bookmarks: Bookmark[]
  position: ReadingPosition | null
}

const KEY = 'islami-bookmarks-v2'
const POS_KEY = 'islami-reading-position-v2'

const EMPTY: State = { bookmarks: [], position: null }
let state: State | null = null
const listeners = new Set<() => void>()

function load(): State {
  if (typeof window === 'undefined') return EMPTY
  if (state) return state
  let bookmarks: Bookmark[] = []
  let position: ReadingPosition | null = null
  try {
    const raw = window.localStorage.getItem(KEY)
    if (raw) bookmarks = JSON.parse(raw)
  } catch {}
  try {
    const raw = window.localStorage.getItem(POS_KEY)
    if (raw) position = JSON.parse(raw)
  } catch {}
  
  state = { bookmarks: Array.isArray(bookmarks) ? bookmarks : [], position }
  return state
}

function commit(next: State) {
  state = next
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next.bookmarks))
    if (next.position) window.localStorage.setItem(POS_KEY, JSON.stringify(next.position))
  } catch {}
  listeners.forEach((l) => l())
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}

export function useBookmarkState(): State {
  return useSyncExternalStore(subscribe, load, () => EMPTY)
}

export function isBookmarked(s: State, surah: number, page: number) {
  return s.bookmarks.some((b) => b.id === `${surah}:${page}`)
}

export function toggleBookmark(surah: number, surahName: string, page: number): boolean {
  const cur = load()
  const id = `${surah}:${page}`
  if (cur.bookmarks.some((b) => b.id === id)) {
    commit({ ...cur, bookmarks: cur.bookmarks.filter((b) => b.id !== id) })
    return false
  }
  commit({
    ...cur,
    bookmarks: [{ id, surah, surahName, page, createdAt: Date.now() }, ...cur.bookmarks],
  })
  return true
}

export function removeBookmark(id: string) {
  const cur = load()
  commit({ ...cur, bookmarks: cur.bookmarks.filter((b) => b.id !== id) })
}

export function saveReadingPosition(surah: number, surahName: string, page: number) {
  const cur = load()
  if (cur.position && cur.position.surah === surah && cur.position.page === page) return
  commit({ ...cur, position: { surah, surahName, page, updatedAt: Date.now() } })
}