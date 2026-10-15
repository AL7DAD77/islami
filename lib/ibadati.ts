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

export const IBADATI_ITEMS: { key: IbadatiKey; label: string; group: 'prayer' | 'dhikr' | 'quran' }[] = [
  { key: 'fajr', label: 'صلاة الفجر', group: 'prayer' },
  { key: 'dhuhr', label: 'صلاة الظهر', group: 'prayer' },
  { key: 'asr', label: 'صلاة العصر', group: 'prayer' },
  { key: 'maghrib', label: 'صلاة المغرب', group: 'prayer' },
  { key: 'isha', label: 'صلاة العشاء', group: 'prayer' },
  { key: 'morning', label: 'أذكار الصباح', group: 'dhikr' },
  { key: 'evening', label: 'أذكار المساء', group: 'dhikr' },
  { key: 'sleep', label: 'أذكار النوم', group: 'dhikr' },
  { key: 'quran', label: 'ورد من القرآن', group: 'quran' },
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

/** تحدٍّ يومي ثابت لليوم نفسه (يتغير كل يوم)، من أعمال عامة لا تحتاج فتوى */
export const DAILY_CHALLENGES: string[] = [
  'اقرأ صفحة من القرآن الكريم بتدبّر',
  'استغفر الله مئة مرة',
  'تصدّق ولو بشيء قليل',
  'صل صلة رحم بمكالمة أو زيارة',
  'ابتسم في وجه أخيك، فهي صدقة',
  'أكثر من الصلاة على النبي ﷺ اليوم',
  'ساعد أحداً من أهل بيتك دون أن يطلب',
  'اقرأ حديثاً من الأحاديث المختارة في التطبيق',
]

export function challengeFor(date: string): string {
  // مجموع أرقام التاريخ يعطي فهرساً ثابتاً لكل يوم
  const sum = date.split('').reduce((a, c) => a + (c >= '0' && c <= '9' ? Number(c) : 0), 0)
  return DAILY_CHALLENGES[sum % DAILY_CHALLENGES.length]
}
