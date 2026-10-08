export const HIJRI_MONTHS = [
  'محرم',
  'صفر',
  'ربيع الأول',
  'ربيع الآخر',
  'جمادى الأولى',
  'جمادى الآخرة',
  'رجب',
  'شعبان',
  'رمضان',
  'شوال',
  'ذو القعدة',
  'ذو الحجة',
]

export interface HijriDate {
  day: number
  month: number
  year: number
  monthName: string
}

const fmt = typeof Intl !== 'undefined'
  ? new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', { day: 'numeric', month: 'numeric', year: 'numeric' })
  : null

export function toHijri(date: Date, adjustDays = 0): HijriDate {
  const d = new Date(date)
  d.setDate(d.getDate() + adjustDays)
  const parts = fmt!.formatToParts(d)
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0)
  const month = get('month')
  return { day: get('day'), month, year: get('year'), monthName: HIJRI_MONTHS[month - 1] }
}

export function formatHijri(date: Date, adjustDays = 0) {
  const h = toHijri(date, adjustDays)
  return `${toArabicDigits(h.day)} ${h.monthName} ${toArabicDigits(h.year)} هـ`
}

export function toArabicDigits(n: number | string) {
  return String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)])
}

export const ISLAMIC_OCCASIONS: { month: number; day: number; title: string }[] = [
  { month: 1, day: 1, title: 'رأس السنة الهجرية' },
  { month: 1, day: 10, title: 'يوم عاشوراء' },
  { month: 7, day: 27, title: 'ذكرى الإسراء والمعراج (على المشهور)' },
  { month: 8, day: 15, title: 'ليلة النصف من شعبان' },
  { month: 9, day: 1, title: 'بداية شهر رمضان المبارك' },
  { month: 9, day: 21, title: 'بداية العشر الأواخر (ليالي الوتر)' },
  { month: 10, day: 1, title: 'عيد الفطر المبارك' },
  { month: 12, day: 1, title: 'بداية العشر من ذي الحجة' },
  { month: 12, day: 8, title: 'يوم التروية' },
  { month: 12, day: 9, title: 'يوم عرفة' },
  { month: 12, day: 10, title: 'عيد الأضحى المبارك' },
  { month: 12, day: 11, title: 'أيام التشريق' },
]

export function getOccasion(h: HijriDate) {
  const exact = ISLAMIC_OCCASIONS.find((o) => o.month === h.month && o.day === h.day)
  if (exact) return exact.title
  if (h.month === 12 && (h.day === 12 || h.day === 13)) return 'أيام التشريق'
  if (h.day >= 13 && h.day <= 15) return 'الأيام البيض (يُستحب صيامها)'
  return null
}
