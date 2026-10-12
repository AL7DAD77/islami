'use client'

import { useSyncExternalStore } from 'react'

export interface Bookmark {
  id: string
  surah: number
  surahName: string
  ayah: number
  createdAt: number
}

export interface ReadingPosition {
  surah: number
  surahName: string
  ayah: number
  updatedAt: number
}

interface State {
  bookmarks: Bookmark[]
  position: ReadingPosition | null
}

const KEY = 'islami-bookmarks-v1'
const POS_KEY = 'islami-reading-position-v1'
const OLD_KEY = 'quran-bookmark' // المفتاح القديم: كان يُكتب ولا يُقرأ أبداً

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
  // ترحيل العلامة القديمة (إن وُجدت)
  try {
    const old = window.localStorage.getItem(OLD_KEY)
    if (old) {
      const o = JSON.parse(old)
      if (o?.surah && o?.ayah && !bookmarks.some((b) => b.id === `${o.surah}:${o.ayah}`)) {
        bookmarks.unshift({
          id: `${o.surah}:${o.ayah}`,
          surah: o.surah,
          surahName: '',
          ayah: o.ayah,
          createdAt: Date.now(),
        })
      }
      window.localStorage.removeItem(OLD_KEY)
      window.localStorage.setItem(KEY, JSON.stringify(bookmarks))
    }
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

export function isBookmarked(s: State, surah: number, ayah: number) {
  return s.bookmarks.some((b) => b.id === `${surah}:${ayah}`)
}

export function toggleBookmark(surah: number, surahName: string, ayah: number): boolean {
  const cur = load()
  const id = `${surah}:${ayah}`
  if (cur.bookmarks.some((b) => b.id === id)) {
    commit({ ...cur, bookmarks: cur.bookmarks.filter((b) => b.id !== id) })
    return false
  }
  commit({
    ...cur,
    bookmarks: [{ id, surah, surahName, ayah, createdAt: Date.now() }, ...cur.bookmarks],
  })
  return true
}

export function removeBookmark(id: string) {
  const cur = load()
  commit({ ...cur, bookmarks: cur.bookmarks.filter((b) => b.id !== id) })
}

export function saveReadingPosition(surah: number, surahName: string, ayah: number) {
  const cur = load()
  if (cur.position && cur.position.surah === surah && cur.position.ayah === ayah) return
  commit({ ...cur, position: { surah, surahName, ayah, updatedAt: Date.now() } })
}
