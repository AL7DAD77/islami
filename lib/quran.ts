export interface SurahMeta {
  number: number
  name: string
  englishName: string
  numberOfAyahs: number
  revelationType: 'Meccan' | 'Medinan'
}

export type Surah = SurahMeta;

export interface Ayah {
  number: number
  text: string
  numberInSurah: number
  juz: number
  page: number
  sajda: boolean | object
  surah?: { number: number; name: string }
}

export interface Moshaf {
  id: number
  name: string
  server: string
  surahs: number[]
}

export interface Reciter {
  id: number
  name: string
  featured: boolean
  moshaf: Moshaf[]
}

const API = 'https://api.alquran.cloud/v1'

export const FEATURED_RECITERS = [123, 51, 118, 112, 102, 54, 31, 92, 30, 5, 81, 86, 12, 109, 74, 4, 106, 121, 111, 24]

export async function getSurahList(): Promise<SurahMeta[]> {
  const res = await fetch(`${API}/surah`, { next: { revalidate: 60 * 60 * 24 * 30 } })
  if (!res.ok) throw new Error('Failed to load surah list')
  const json = await res.json()
  return json.data
}

export async function getSurah(id: number): Promise<{ meta: SurahMeta; ayahs: Ayah[] }> {
  const res = await fetch(`${API}/surah/${id}/quran-uthmani`, { next: { revalidate: 60 * 60 * 24 * 30 } })
  if (!res.ok) throw new Error('Failed to load surah')
  const { data } = await res.json()
  const { ayahs, ...meta } = data
  return { meta, ayahs }
}

export async function getReciters(): Promise<Reciter[]> {
  // ✅ التعديل الأول: أضفنا limit=300 لجلب جميع القراء وليس 15 فقط
  const res = await fetch('https://www.mp3quran.net/api/v3/reciters?language=ar&limit=300', {
    next: { revalidate: 60 * 60 * 24 },
  })
  if (!res.ok) return []
  const json = await res.json()
  
  const list: Reciter[] = json.reciters.map(
    (r: { id: number; name: string; moshaf: { id: number; name: string; server: string; surah_list: string }[] }) => ({
      id: r.id,
      name: r.name.trim(),
      featured: FEATURED_RECITERS.includes(r.id),
      moshaf: r.moshaf.map((m) => ({
        id: m.id,
        name: m.name.replace(/\s+/g, ' ').trim(),
        // ✅ التعديل الثاني: تأمين أن كل رابط سيرفر ينتهي بـ / 
        server: m.server.endsWith('/') ? m.server : `${m.server}/`,
        surahs: m.surah_list.split(',').map(Number),
      })),
    }),
  )
  
  return list.sort((a, b) => {
    const fa = FEATURED_RECITERS.indexOf(a.id)
    const fb = FEATURED_RECITERS.indexOf(b.id)
    if (fa !== -1 || fb !== -1) return (fa === -1 ? 999 : fa) - (fb === -1 ? 999 : fb)
    return a.name.localeCompare(b.name, 'ar')
  })
}

export function surahAudioUrl(server: string, surah: number) {
  return `${server}${String(surah).padStart(3, '0')}.mp3`
}

const DIACRITICS = /[\u064B-\u065F\u0670\u06D6-\u06ED]/g
export function stripBasmala(text: string, surah: number, ayahInSurah: number) {
  if (surah === 1 || surah === 9 || ayahInSurah !== 1) return text
  const words = text.split(' ')
  if (words.length > 4 && words[0].replace(DIACRITICS, '').includes('بسم')) return words.slice(4).join(' ')
  return text
}

export function toArabicNumber(n: number) {
  return String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)])
}