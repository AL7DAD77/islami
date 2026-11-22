'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import * as BookmarksLib from '@/lib/bookmarks'
import { useLanguage } from '@/lib/language-context'

interface SavedReadingPos {
  surah?: number
  page?: number
}

const TARGET_PAGE_OVERRIDE_KEY = 'mushaf-target-page-override'

function resolveLastReadingPosition(): SavedReadingPos | null {
  try {
    const libAny = BookmarksLib as unknown as Record<string, unknown>
    const fn =
      typeof libAny.loadReadingPosition === 'function'
        ? (libAny.loadReadingPosition as () => SavedReadingPos | null)
        : typeof libAny.getReadingPosition === 'function'
          ? (libAny.getReadingPosition as () => SavedReadingPos | null)
          : null

    if (fn) {
      const pos = fn()
      if (pos && (typeof pos.page === 'number' || typeof pos.surah === 'number')) {
        return pos
      }
    }

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key || !key.toLowerCase().includes('reading')) continue
      const raw = localStorage.getItem(key)
      if (!raw) continue
      const parsed = JSON.parse(raw) as SavedReadingPos
      if (parsed && (typeof parsed.page === 'number' || typeof parsed.surah === 'number')) {
        return parsed
      }
    }
  } catch {
    // تجاهل أخطاء القراءة المحلية
  }

  return null
}

export function QuranMain({ surahs }: { surahs: any[] }) {
  const router = useRouter()
  const { locale } = useLanguage()
  const [navigated, setNavigated] = useState(false)

  useEffect(() => {
    if (navigated) return
    setNavigated(true)

    const saved = resolveLastReadingPosition()
    const rawSurah =
      saved?.surah && Number.isInteger(saved.surah) && saved.surah >= 1 && saved.surah <= 114
        ? saved.surah
        : 1

    const surahExists = Array.isArray(surahs)
      ? surahs.some((s) => Number(s?.id ?? s?.number) === rawSurah)
      : true

    const safeSurah = surahExists ? rawSurah : 1

    try {
      if (saved?.page && Number.isInteger(saved.page) && saved.page >= 1 && saved.page <= 604) {
        localStorage.setItem(TARGET_PAGE_OVERRIDE_KEY, String(saved.page))
      } else {
        localStorage.removeItem(TARGET_PAGE_OVERRIDE_KEY)
      }
    } catch {
      // تجاهل أخطاء التخزين المحلي
    }

    router.replace(`/quran/${safeSurah}`)
  }, [navigated, router, surahs])

  return (
    <div
      className="flex min-h-dvh w-full items-center justify-center bg-background text-foreground"
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="size-7 animate-spin text-primary" />
        <p className="text-sm font-bold">
          {locale === 'ar'
            ? 'جارٍ الانتقال إلى آخر موضع قراءة...'
            : 'Opening your last reading position...'}
        </p>
      </div>
    </div>
  )
}
