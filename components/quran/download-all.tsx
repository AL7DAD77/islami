'use client'

import { useEffect, useState } from 'react'
import { Download, CheckCircle2, Loader2 } from 'lucide-react'
import { MUSHAF_CACHE, MUSHAF_FONT_URL, MUSHAF_PAGES, pageUrl } from '@/lib/mushaf'

// ما يحتاجه القارئ ليعمل: بيانات وصفية + فهرس الآيات + الخط + صفحات المصحف الـ٦٠٤
const SUPPORT_FILES = ['/mushaf/meta.json', '/mushaf/ayah-index.json', MUSHAF_FONT_URL]
const TOTAL_SURAHS = MUSHAF_PAGES // تُعرض كعدّاد صفحات

/** عدد صفحات المصحف المحفوظة فعلاً في ذاكرة الجهاز. */
async function countCachedPages(): Promise<number> {
  if (typeof caches === 'undefined') return 0
  const cache = await caches.open(MUSHAF_CACHE)
  const keys = await cache.keys()
  return keys.filter((r) => r.url.includes('/mushaf/pages/')).length
}

export function DownloadAll() {
  const [status, setStatus] = useState<'idle' | 'downloading' | 'done'>('idle')
  const [progress, setProgress] = useState(0)
  const [count, setCount] = useState(0)

  const [supported, setSupported] = useState(true)

  // احسب عدد الصفحات المحفوظة عند الفتح
  useEffect(() => {
    if (typeof caches === 'undefined') {
      setSupported(false)
      return
    }
    countCachedPages()
      .then((n) => {
        setCount(n)
        if (n === TOTAL_SURAHS) setStatus('done')
      })
      .catch(() => setSupported(false))
  }, [])

  const handleDownload = async () => {
    if (status === 'downloading') return
    setStatus('downloading')
    setProgress(0)

    try {
      const cache = await caches.open(MUSHAF_CACHE)

      const save = async (url: string) => {
        if (await cache.match(url)) return
        try {
          await cache.add(url)
        } catch (e) {
          console.warn(`فشل حفظ ${url}`, e)
        }
      }

      for (const url of SUPPORT_FILES) await save(url)

      // نحفظ الصفحات على دفعات صغيرة حتى لا نُثقل الشبكة
      const BATCH = 8
      for (let start = 1; start <= MUSHAF_PAGES; start += BATCH) {
        const batch: Promise<void>[] = []
        for (let p = start; p < start + BATCH && p <= MUSHAF_PAGES; p++) batch.push(save(pageUrl(p)))
        await Promise.all(batch)

        const done = Math.min(start + BATCH - 1, MUSHAF_PAGES)
        setProgress(Math.round((done / MUSHAF_PAGES) * 100))
        setCount(done)
      }

      // لا نُعلن الاكتمال إلا بعد التأكد من حفظ كل الصفحات فعلاً
      const saved = await countCachedPages()
      setCount(saved)
      setStatus(saved === MUSHAF_PAGES ? 'done' : 'idle')
    } catch (e) {
      console.warn('تعذر حفظ المصحف', e)
      setStatus('idle')
    }
  }

  if (!supported) return null

  // ============ إذا مكتمل ============
  if (status === 'done') {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="size-6 text-emerald-600 dark:text-emerald-400" />
          <div className="flex-1">
            <p className="font-bold text-emerald-800 dark:text-emerald-300">
              صفحات المصحف محفوظة على جهازك
            </p>
            <p className="text-xs text-emerald-700 dark:text-emerald-400">
              تُقرأ الصفحات دون إنترنت ✅ (التلاوة الصوتية تحتاج إنترنت)
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
          تحميل المصحف كاملاً
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          للقراءة دون إنترنت · نحو ٢ ميجابايت · {count}/{TOTAL_SURAHS} صفحة محفوظة
        </p>
      </div>
      <span className="text-xs text-zinc-400">←</span>
    </button>
  )
}