'use client'

import { useEffect, useState } from 'react'
import { Download, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import { getSurah } from '@/lib/quran'

const SURAH_CACHE_PREFIX = 'quran-surah-'
const TOTAL_SURAHS = 114

export function DownloadAll() {
  const [status, setStatus] = useState<'idle' | 'downloading' | 'done'>('idle')
  const [progress, setProgress] = useState(0)
  const [count, setCount] = useState(0)

  // احسب عدد السور المحفوظة عند الفتح
  useEffect(() => {
    let n = 0
    for (let i = 1; i <= TOTAL_SURAHS; i++) {
      if (localStorage.getItem(`${SURAH_CACHE_PREFIX}${i}`)) n++
    }
    setCount(n)
    if (n === TOTAL_SURAHS) setStatus('done')
  }, [])

  const handleDownload = async () => {
    if (status === 'downloading') return
    setStatus('downloading')
    setProgress(0)
    setCount(0)

    let done = 0
    for (let i = 1; i <= TOTAL_SURAHS; i++) {
      if (localStorage.getItem(`${SURAH_CACHE_PREFIX}${i}`)) {
        done++
        setProgress(Math.round((done / TOTAL_SURAHS) * 100))
        setCount(done)
        continue
      }
      try {
        const data = await getSurah(i)
        localStorage.setItem(`${SURAH_CACHE_PREFIX}${i}`, JSON.stringify(data))
      } catch (e) {
        console.warn(`فشل تحميل السورة ${i}`, e)
      }
      done++
      setProgress(Math.round((done / TOTAL_SURAHS) * 100))
      setCount(done)
    }

    setStatus('done')
  }

  // ============ إذا مكتمل ============
  if (status === 'done') {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="size-6 text-emerald-600 dark:text-emerald-400" />
          <div className="flex-1">
            <p className="font-bold text-emerald-800 dark:text-emerald-300">
              القرآن محفوظ بالكامل
            </p>
            <p className="text-xs text-emerald-700 dark:text-emerald-400">
              يعمل الآن بدون إنترنت ✅
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ============ أثناء التحميل ============
  if (status === 'downloading') {
    return (
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
        <div className="flex items-center gap-3">
          <Loader2 className="size-6 animate-spin text-blue-600 dark:text-blue-400" />
          <div className="flex-1">
            <p className="font-bold text-blue-800 dark:text-blue-300">
              جارٍ التحميل... {count}/{TOTAL_SURAHS}
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-blue-200 dark:bg-blue-900">
              <div
                className="h-full bg-blue-600 transition-all dark:bg-blue-400"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ============ الحالة الافتراضية ============
  return (
    <button
      type="button"
      onClick={handleDownload}
      className="flex w-full items-center gap-3 rounded-2xl border border-emerald-200 bg-white p-4 text-right shadow-sm transition hover:border-emerald-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
    >
      <Download className="size-6 text-emerald-600 dark:text-emerald-400" />
      <div className="flex-1">
        <p className="font-bold text-zinc-800 dark:text-zinc-100">
          تحميل القرآن كاملاً
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          يعمل بدون إنترنت · حجم صغير · {count}/{TOTAL_SURAHS} محفوظة
        </p>
      </div>
      <span className="text-xs text-zinc-400">←</span>
    </button>
  )
}