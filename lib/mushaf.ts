/**
 * المصحف بصفحاته: 604 صفحة بتخطيط مصحف المدينة (15 سطراً).
 * البيانات مولَّدة بسكربت tools/build_mushaf_data.py من:
 *  - تخطيط KFGQPC (QUL)  - نص QPC Hafs كلمة بكلمة (QUL)  - خط KFGQPC HAFS Uthmanic Script v2.2
 */

export const MUSHAF_PAGES = 604
export const MUSHAF_FONT = 'KFGQPC Hafs'
export const MUSHAF_FONT_URL = '/fonts/UthmanicHafs_V22.woff2'
/** اسم ذاكرة الصفحات المحفوظة على الجهاز (تملؤها ميزة «تحميل القرآن كاملاً») */
export const MUSHAF_CACHE = 'mushaf-v1'

export type MushafLine =
  /** سطر آيات: c=1 يعني سطراً متوسَّطاً (لا يُضبط على العرض)، s = رقم السورة، w = كلمات، a = رقم الآية لكل كلمة */
  | { t: 'a'; c: 0 | 1; s: number; w: string[]; a: number[] }
  /** سطر اسم سورة */
  | { t: 's'; n: number }
  /** سطر بسملة */
  | { t: 'b' }

export interface MushafPageData {
  p: number
  j: number
  l: MushafLine[]
}

export interface MushafMeta {
  version: number
  pages: number
  /** عرض أطول سطر في المصحف كله بوحدة em (محسوب بالخط نفسه) */
  maxLineEm: number
  /** عرض المسافة بوحدة em */
  spaceEm: number
  basmalah: string
  surahNames: string[]
  surahStartPage: number[]
  juzStartPage: number[]
}

export const JUZ_NAMES = [
  'الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع', 'الثامن', 'التاسع', 'العاشر',
  'الحادي عشر', 'الثاني عشر', 'الثالث عشر', 'الرابع عشر', 'الخامس عشر', 'السادس عشر', 'السابع عشر',
  'الثامن عشر', 'التاسع عشر', 'العشرون', 'الحادي والعشرون', 'الثاني والعشرون', 'الثالث والعشرون',
  'الرابع والعشرون', 'الخامس والعشرون', 'السادس والعشرون', 'السابع والعشرون', 'الثامن والعشرون',
  'التاسع والعشرون', 'الثلاثون',
]

export function clampPage(n: number): number {
  if (!Number.isFinite(n)) return 1
  return Math.min(MUSHAF_PAGES, Math.max(1, Math.round(n)))
}

export function pageUrl(page: number): string {
  return `/mushaf/pages/${String(clampPage(page)).padStart(3, '0')}.json`
}

/** علامة نهاية الآية في النص رقم عربي فقط، والخط يرسمه داخل الزخرفة بنفسه. */
export function isAyahMarker(text: string): boolean {
  return /^[٠-٩]+$/.test(text)
}

/** سورة الصفحة المعروضة في الرأس: سورة أول سطر آيات أو اسم سورة في الصفحة. */
export function headerSurah(page: MushafPageData): number {
  for (const line of page.l) {
    if (line.t === 'a') return line.s
    if (line.t === 's') return line.n
  }
  return 1
}

/** أرقام السور الظاهرة في الصفحة بترتيب ظهورها (قد تضم الصفحة أكثر من سورة). */
export function pageSurahs(page: MushafPageData): number[] {
  const out: number[] = []
  for (const line of page.l) {
    const n = line.t === 'a' ? line.s : line.t === 's' ? line.n : null
    if (n !== null && !out.includes(n)) out.push(n)
  }
  return out
}

export interface Fit {
  fontSize: number
  contentWidth: number
}

const WIDTH_SAFETY = 1.02 // هامش أمان فوق القياس (اختلاف طفيف بين محركات الرسم)
const LINE_HEIGHT_EM = 1.55 // أقل ارتفاع سطر يتسع لعلامات الضبط العليا والسفلى

/**
 * حجم الخط بحيث يتسع أعرض سطر في المصحف كله لعرض المساحة المتاحة، دون أن تتجاوز الأسطر
 * الخمسة عشر ارتفاعها. الحجم ثابت لكل الصفحات كما في المصحف المطبوع.
 */
export function computeFit(width: number, height: number, meta: MushafMeta): Fit {
  const lineEm = meta.maxLineEm * WIDTH_SAFETY
  const byWidth = width / lineEm
  const byHeight = height / 15 / LINE_HEIGHT_EM
  const fontSize = Math.max(8, Math.min(byWidth, byHeight))
  return { fontSize, contentWidth: Math.min(width, fontSize * lineEm) }
}

/** فهرس الآيات: pages = صفحة بداية كل آية، letters = عدد حروفها (لتقدير الآية الجارية أثناء التلاوة) */
export interface AyahIndex {
  pages: number[][]
  letters: number[][]
}

/** صفحة بداية الآية؛ وإن لم تتوفر فصفحة بداية السورة. */
export function pageOfAyah(index: AyahIndex, meta: MushafMeta, surah: number, ayah: number): number {
  const page = index.pages[surah - 1]?.[ayah - 1]
  return clampPage(page ?? meta.surahStartPage[surah - 1] ?? 1)
}

/** أول آية تظهر في الصفحة (قد تكون متمّمة لآية بدأت في الصفحة السابقة). */
export function firstAyahOnPage(page: MushafPageData): { s: number; a: number } | null {
  for (const line of page.l) {
    if (line.t === 'a' && line.a.length > 0) return { s: line.s, a: line.a[0] }
  }
  return null
}

/**
 * تقدير الآية الجارية من نسبة التقدم في ملف السورة (0..1).
 * نوزّع الزمن حسب عدد حروف كل آية (الآيات تختلف في الطول)، وهو تقدير جيد لأغلب القراء وليس مطابقاً للثانية.
 * الأوزان من عدد حروف كل آية (من ayah-index.json)، وهو تقدير وليس توقيتاً دقيقاً.
 */
export function estimateAyahFromLetters(letters: number[] | undefined, surah: number, fraction: number): number | null {
  if (!letters || letters.length === 0 || !(fraction > 0)) return null

  const weights = letters.map((n) => Math.max(8, n) + 4) // + زمن الوقفة بين الآيات
  // بداية الملف غالباً فيها البسملة، إلا الفاتحة (البسملة آية فيها) والتوبة
  const lead = surah === 1 || surah === 9 ? 0 : 22
  const total = lead + weights.reduce((x, y) => x + y, 0)
  const pos = Math.min(fraction, 1) * total - lead
  if (pos <= 0) return 1

  let acc = 0
  for (let i = 0; i < weights.length; i++) {
    acc += weights[i]
    if (pos <= acc) return i + 1
  }
  return letters.length
}

/** يقرأ الملف من ذاكرة الجهاز إن كان محفوظاً (ليعمل دون إنترنت)، وإلا من الشبكة. */
export async function cachedFetch(url: string): Promise<Response> {
  try {
    if (typeof caches !== 'undefined') {
      const hit = await caches.match(url, { cacheName: MUSHAF_CACHE })
      if (hit) return hit
    }
  } catch {}
  return fetch(url, { cache: 'force-cache' })
}

let fontPromise: Promise<void> | null = null

/** يحمّل خط المصحف مرة واحدة (من الذاكرة المحفوظة إن وُجد) ويسجّله في المتصفح. */
export function loadMushafFont(): Promise<void> {
  if (!fontPromise) {
    fontPromise = (async () => {
      const res = await cachedFetch(MUSHAF_FONT_URL)
      if (!res.ok) throw new Error('font')
      const face = new FontFace(MUSHAF_FONT, await res.arrayBuffer())
      await face.load()
      document.fonts.add(face)
    })().catch((error) => {
      fontPromise = null
      throw error
    })
  }
  return fontPromise
}

/**
 * ملاءمة بالعرض فقط (لصفحات تُعرض داخل بطاقة قابلة للتمرير كالورد اليومي):
 * حجم الخط بحيث يتسع أعرض سطر في المصحف، والارتفاع يتبع عدد الأسطر.
 */
export function computeWidthFit(width: number, meta: MushafMeta): Fit {
  const lineEm = meta.maxLineEm * WIDTH_SAFETY
  const fontSize = Math.max(8, width / lineEm)
  return { fontSize, contentWidth: Math.min(width, fontSize * lineEm) }
}

let metaPromise: Promise<MushafMeta> | null = null

/** يحمّل البيانات الوصفية مرة واحدة (من الذاكرة المحفوظة إن وُجدت). */
export function loadMushafMeta(): Promise<MushafMeta> {
  if (!metaPromise) {
    metaPromise = (async () => {
      const res = await cachedFetch('/mushaf/meta.json')
      if (!res.ok) throw new Error('meta')
      return (await res.json()) as MushafMeta
    })().catch((error) => {
      metaPromise = null
      throw error
    })
  }
  return metaPromise
}

const pageCache = new Map<number, MushafPageData>()

/** يحمّل صفحة من المصحف (مع ذاكرة مؤقتة في الصفحة). */
export async function loadMushafPage(page: number): Promise<MushafPageData> {
  const n = clampPage(page)
  const hit = pageCache.get(n)
  if (hit) return hit
  const res = await cachedFetch(pageUrl(n))
  if (!res.ok) throw new Error('page')
  const json = (await res.json()) as MushafPageData
  pageCache.set(n, json)
  return json
}
