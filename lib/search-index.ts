import { ADHKAR } from '@/lib/adhkar'
import { PROPHETS } from '@/lib/prophets'
import { HADITHS } from '@/lib/hadiths'
import { GHAZAWAT } from '@/lib/ghazawat'
import { FORGOTTEN_SUNAN, RAWATIB } from '@/lib/sunan'

export type SearchKind = 'ذكر' | 'نبي' | 'حديث' | 'غزوة' | 'سنة' | 'آية' | 'حديث صحيح'
export type SearchType = 'ayah' | 'hadith' | 'other'

export interface SearchEntry {
  kind: SearchKind
  type: SearchType
  title: string
  body: string
  href: string
}

/** توحيد النص العربي للبحث */
export function normalizeForSearch(input: string): string {
  return input
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/[ىئ]/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/\\n|\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** هل يكفي الاستعلام لبدء البحث؟ كلمة من 3 أحرف أو كلمتان */
export function isQueryReady(query: string): boolean {
  const words = normalizeForSearch(query).split(' ').filter((w) => w.length >= 2)
  if (words.length >= 2) return true
  return words.length === 1 && words[0].length >= 3
}

/** مقتطف قصير حول أول كلمة مطابقة */
export function snippet(text: string, words: string[], radius = 80): string {
  const clean = text.replace(/\\n|\n/g, ' ').replace(/\s+/g, ' ').trim()
  const norm = normalizeForSearch(clean)
  let at = -1
  for (const w of words) {
    const i = norm.indexOf(w)
    if (i !== -1 && (at === -1 || i < at)) at = i
  }
  if (at === -1) return clean.slice(0, radius * 2)
  const start = Math.max(0, at - radius)
  const end = Math.min(clean.length, at + radius)
  return (start > 0 ? '…' : '') + clean.slice(start, end) + (end < clean.length ? '…' : '')
}

/* ------------------------- الفهرس المحلي (صغير) ------------------------- */

export function buildIndex(): SearchEntry[] {
  const out: SearchEntry[] = []
  for (const cat of ADHKAR) {
    cat.items.forEach((d) =>
      out.push({ kind: 'ذكر', type: 'other', title: cat.title, body: `${d.text} ${d.source}`, href: `/adhkar/${cat.id}` }),
    )
  }
  for (const p of PROPHETS)
    out.push({ kind: 'نبي', type: 'other', title: p.name, body: p.summary, href: '/prophets' })
  for (const h of HADITHS)
    out.push({ kind: 'حديث', type: 'hadith', title: h.text, body: `${h.source} ${h.explanation}`, href: '/hadith' })
  for (const g of GHAZAWAT)
    out.push({ kind: 'غزوة', type: 'other', title: g.name, body: `${g.date} ${g.place} ${g.summary}`, href: '/hadith/ghazawat' })
  for (const r of RAWATIB)
    out.push({ kind: 'سنة', type: 'other', title: `سنة ${r.prayer} ${r.position}`, body: `${r.rakaat} ركعات ${r.note ?? ''}`, href: '/sunan' })
  for (const s of FORGOTTEN_SUNAN)
    out.push({ kind: 'سنة', type: 'other', title: s.title, body: `${s.hadith} ${s.source}`, href: '/sunan' })
  return out
}

/* ------------------------- التحميل الكسول للآيات والصحيحين ------------------------- */

interface BookJson {
  chapters?: { id: number; arabic?: string }[]
  hadiths?: { chapterId?: number; arabic?: string }[]
}

let sahihCache: SearchEntry[] | null = null
let sahihPromise: Promise<SearchEntry[]> | null = null

async function loadBook(file: string, label: string): Promise<SearchEntry[]> {
  try {
    const res = await fetch(`/hadith/${file}`)
    if (!res.ok) return []
    const data = (await res.json()) as BookJson
    const chapterName = new Map(
      (Array.isArray(data.chapters) ? data.chapters : []).map((c) => [c.id, c.arabic ?? '']),
    )
    const out: SearchEntry[] = []
    for (const h of Array.isArray(data.hadiths) ? data.hadiths : []) {
      if (typeof h.arabic !== 'string' || !h.arabic.trim()) continue
      out.push({
        kind: 'حديث صحيح',
        type: 'hadith',
        title: `${label} - ${chapterName.get(h.chapterId ?? -1) ?? ''}`,
        body: h.arabic,
        href: '/sahihayn',
      })
    }
    return out
  } catch {
    return []
  }
}

export function loadSahihayn(): Promise<SearchEntry[]> {
  if (sahihCache) return Promise.resolve(sahihCache)
  if (!sahihPromise) {
    sahihPromise = Promise.all([
      loadBook('bukhari.json', 'البخاري'),
      loadBook('muslim.json', 'مسلم'),
    ]).then(([a, b]) => {
      sahihCache = [...a, ...b]
      return sahihCache
    })
  }
  return sahihPromise
}

let ayahCache: SearchEntry[] | null = null
let ayahPromise: Promise<SearchEntry[]> | null = null

interface MushafWord {
  text?: string
  type?: string
  verse_key?: string
}
interface MushafPage {
  surahs?: { id: number; name_arabic?: string }[]
  lines?: { words?: MushafWord[] }[]
}

/** ملفات المصحف مسماة 001.json إلى 604.json بدون بادئة */
async function loadMushafPage(n: number): Promise<MushafPage | null> {
  try {
    const res = await fetch(`/mushaf-qcf4/pages/${String(n).padStart(3, '0')}.json`)
    if (!res.ok) return null
    return (await res.json()) as MushafPage
  } catch {
    return null
  }
}

async function loadAyahsInternal(): Promise<SearchEntry[]> {
  const verses = new Map<string, { surah: number; verse: number; words: string[] }>()
  const surahNames = new Map<number, string>()
  const BATCH = 20

  for (let start = 1; start <= 604; start += BATCH) {
    const pages = await Promise.all(
      Array.from({ length: Math.min(BATCH, 605 - start) }, (_, i) => loadMushafPage(start + i)),
    )
    for (const data of pages) {
      if (!data) continue
      for (const s of data.surahs ?? []) if (s.name_arabic) surahNames.set(s.id, s.name_arabic)
      for (const line of data.lines ?? []) {
        for (const w of line.words ?? []) {
          if (w.type !== 'word' || !w.verse_key || !w.text) continue
          const [s, v] = w.verse_key.split(':').map(Number)
          if (!s || !v) continue
          const key = `${s}:${v}`
          const entry = verses.get(key) ?? { surah: s, verse: v, words: [] }
          entry.words.push(w.text)
          verses.set(key, entry)
        }
      }
    }
  }

  return Array.from(verses.values()).map((v) => ({
    kind: 'آية',
    type: 'ayah',
    title: `${surahNames.get(v.surah) ?? `سورة ${v.surah}`} - آية ${v.verse}`,
    body: v.words.join(' '),
    href: `/quran/${v.surah}`,
  }))
}

export function loadAyahs(): Promise<SearchEntry[]> {
  if (ayahCache) return Promise.resolve(ayahCache)
  if (!ayahPromise) {
    ayahPromise = loadAyahsInternal().then((list) => {
      ayahCache = list
      return list
    })
  }
  return ayahPromise
}

/* ------------------------- البحث ------------------------- */

/** بحث: كل كلمة في الاستعلام يجب أن تظهر في العنوان أو المحتوى، وتُرتّب بالأهمية */
export function search(index: SearchEntry[], query: string, limit = 40): SearchEntry[] {
  const words = normalizeForSearch(query).split(' ').filter((w) => w.length >= 2)
  if (words.length === 0) return []

  const hits: { e: SearchEntry; score: number }[] = []
  for (const e of index) {
    const t = normalizeForSearch(e.title)
    const b = normalizeForSearch(e.body)
    if (!words.every((w) => t.includes(w) || b.includes(w))) continue
    const score = words.reduce((s, w) => s + (t.includes(w) ? 2 : 0) + (b.includes(w) ? 1 : 0), 0)
    hits.push({ e, score })
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, limit).map((h) => h.e)
}

/**
 * بحث شامل. لا يحمّل شيئاً حتى يكون الاستعلام جاهزاً (كلمتان أو كلمة من 3 أحرف).
 */
export async function searchAll(query: string, limit = 40): Promise<SearchEntry[]> {
  if (!isQueryReady(query)) return []
  const [ayahs, sahih] = await Promise.all([loadAyahs(), loadSahihayn()])
  return search([...buildIndex(), ...ayahs, ...sahih], query, limit)
}

/** الكلمات المنظّفة للاستعلام، لتمريرها إلى snippet */
export function queryWords(query: string): string[] {
  return normalizeForSearch(query).split(' ').filter((w) => w.length >= 2)
}