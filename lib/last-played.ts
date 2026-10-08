const KEY = 'islami-last-played'

export interface LastPlayed {
  surah: number
  surahName: string
  reciterId: number
  timestamp: number
}

export function saveLastPlayed(data: Omit<LastPlayed, 'timestamp'>) {
  if (typeof window === 'undefined') return
  try {
    const payload: LastPlayed = { ...data, timestamp: Date.now() }
    localStorage.setItem(KEY, JSON.stringify(payload))
  } catch {}
}

export function getLastPlayed(): LastPlayed | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    return JSON.parse(raw) as LastPlayed
  } catch {
    return null
  }
}

export function clearLastPlayed() {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(KEY)
  } catch {}
}