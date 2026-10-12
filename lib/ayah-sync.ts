import type { Ayah } from '@/lib/quran'
import { stripBasmala } from '@/lib/quran'

const DIACRITICS = /[\u064B-\u065F\u0670\u06D6-\u06ED\u08D3-\u08FF]/g

/**
 * تقدير الآية الجارية من نسبة التقدم في ملف السورة.
 * التقسيم الخطي (التقدم × عدد الآيات) خاطئ لأن الآيات تختلف في الطول؛ لذلك نوزّع الزمن
 * حسب عدد حروف كل آية. وهو تقدير جيد لأغلب القراء، وليس مطابقاً للثانية.
 */
export function estimateAyah(ayahs: Ayah[], surah: number, fraction: number): number | null {
  if (!ayahs.length || !(fraction > 0)) return null

  const weights = ayahs.map((a) => {
    const text = stripBasmala(a.text.replace('\ufeff', ''), surah, a.numberInSurah)
    const letters = text.replace(DIACRITICS, '').replace(/\s+/g, '').length
    return Math.max(8, letters) + 4 // + زمن الوقفة بين الآيات
  })

  // بداية الملف غالباً فيها البسملة، إلا الفاتحة (البسملة آية فيها) والتوبة
  const lead = surah === 1 || surah === 9 ? 0 : 22
  const total = lead + weights.reduce((x, y) => x + y, 0)
  const pos = Math.min(fraction, 1) * total - lead
  if (pos <= 0) return ayahs[0].numberInSurah

  let acc = 0
  for (let i = 0; i < ayahs.length; i++) {
    acc += weights[i]
    if (pos <= acc) return ayahs[i].numberInSurah
  }
  return ayahs[ayahs.length - 1].numberInSurah
}
