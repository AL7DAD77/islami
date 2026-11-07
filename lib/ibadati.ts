/**
 * «عباداتي»: قائمة متابعة يومية تُحفظ محلياً على الجهاز فقط.
 * لا تُرسل أي بيانات، وتُصفَّر تلقائياً مع بداية كل يوم.
 */

export type IbadatiKey =
  | 'fajr'
  | 'dhuhr'
  | 'asr'
  | 'maghrib'
  | 'isha'
  | 'morning'
  | 'evening'
  | 'quran'
  | 'sleep'

export const IBADATI_ITEMS: { key: IbadatiKey; group: 'prayer' | 'dhikr' | 'quran' }[] = [
  { key: 'fajr', group: 'prayer' },
  { key: 'dhuhr', group: 'prayer' },
  { key: 'asr', group: 'prayer' },
  { key: 'maghrib', group: 'prayer' },
  { key: 'isha', group: 'prayer' },
  { key: 'morning', group: 'dhikr' },
  { key: 'evening', group: 'dhikr' },
  { key: 'sleep', group: 'dhikr' },
  { key: 'quran', group: 'quran' },
]

export interface IbadatiState {
  date: string
  done: Partial<Record<IbadatiKey, boolean>>
}

export const IBADATI_KEY = 'ibadati-v1'

/** تاريخ اليوم المحلي بصيغة ثابتة، مثل 2026-10-14 */
export function dayKey(d: Date = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

/** الحالة لليوم الحالي؛ إن كانت محفوظة ليوم سابق تُعاد فارغة */
export function normalizeState(raw: unknown, today: string): IbadatiState {
  const fresh: IbadatiState = { date: today, done: {} }
  if (!raw || typeof raw !== 'object') return fresh
  const r = raw as Partial<IbadatiState>
  if (r.date !== today || !r.done || typeof r.done !== 'object') return fresh
  const valid = new Set(IBADATI_ITEMS.map((i) => i.key))
  const done: IbadatiState['done'] = {}
  for (const [k, v] of Object.entries(r.done)) {
    if (valid.has(k as IbadatiKey) && v === true) done[k as IbadatiKey] = true
  }
  return { date: today, done }
}

export function toggleItem(state: IbadatiState, key: IbadatiKey): IbadatiState {
  const done = { ...state.done }
  if (done[key]) delete done[key]
  else done[key] = true
  return { ...state, done }
}

export function progress(state: IbadatiState): { count: number; total: number; percent: number } {
  const total = IBADATI_ITEMS.length
  const count = IBADATI_ITEMS.filter((i) => state.done[i.key]).length
  return { count, total, percent: Math.round((count / total) * 100) }
}

/** يعيد فهرس التحدي اليومي بناءً على التاريخ (ثابت لكل يوم، يتغير يومياً) */
export function challengeIndexFor(date: string): number {
  const sum = date.split('').reduce((a, c) => a + (c >= '0' && c <= '9' ? Number(c) : 0), 0)
  return sum % 8 // لدينا 8 تحديات في ملف الترجمة
}