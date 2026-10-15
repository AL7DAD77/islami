import { ADHKAR } from '@/lib/adhkar'
import { PROPHETS } from '@/lib/prophets'
import { HADITHS } from '@/lib/hadith'
import { GHAZAWAT } from '@/lib/ghazawat'
import { FORGOTTEN_SUNAN, RAWATIB } from '@/lib/sunan'

export type SearchKind = 'ذكر' | 'نبي' | 'حديث' | 'غزوة' | 'سنة'

export interface SearchEntry {
  kind: SearchKind
  title: string
  body: string
  href: string
}

/** توحيد النص العربي للبحث: بلا تشكيل، والهمزات والتاء المربوطة والياء المقصورة موحّدة */
export function normalizeForSearch(input: string): string {
  return input
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/[ىئ]/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/\s+/g, ' ')
    .trim()
}

/** فهرس بسيط من محتوى التطبيق الموجود فقط */
export function buildIndex(): SearchEntry[] {
  const out: SearchEntry[] = []
  for (const cat of ADHKAR) {
    cat.items.forEach((d) => out.push({ kind: 'ذكر', title: cat.title, body: `${d.text} ${d.source}`, href: `/adhkar/${cat.id}` }))
  }
  for (const p of PROPHETS) out.push({ kind: 'نبي', title: p.name, body: p.summary, href: '/prophets' })
  for (const h of HADITHS) out.push({ kind: 'حديث', title: h.text, body: `${h.source} ${h.explanation}`, href: '/hadith' })
  for (const g of GHAZAWAT) out.push({ kind: 'غزوة', title: g.name, body: `${g.date} ${g.place} ${g.summary}`, href: `/hadith/ghazawat` })
  for (const r of RAWATIB) out.push({ kind: 'سنة', title: `سنة ${r.prayer} ${r.position}`, body: `${r.rakaat} ركعات ${r.note ?? ''}`, href: '/sunan' })
  for (const s of FORGOTTEN_SUNAN) out.push({ kind: 'سنة', title: s.title, body: `${s.hadith} ${s.source}`, href: '/sunan' })
  return out
}

/** بحث: كل كلمة في الاستعلام يجب أن تظهر في العنوان أو المحتوى */
export function search(index: SearchEntry[], query: string, limit = 30): SearchEntry[] {
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
