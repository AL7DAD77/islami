'use client'

import Link from 'next/link'
import {
  ChevronLeft,
  BookOpen,
  Shield,
  Sun,
  Moon,
  Heart,
  Star,
  CircleDashed,
  Sunrise,
  Sunset,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { PageHeader } from '@/components/page-header'
import { SearchButton } from '@/components/search-button'
import { ADHKAR, ADHKAR_GROUPS } from '@/lib/adhkar'
import { toArabicNumber } from '@/lib/quran'
import { AyahCard } from '@/components/adhkar/ayah-card'
import { useLanguage } from '@/lib/language-context'
import { cn } from '@/lib/utils'

const COMPLETED_SECTIONS_KEY = 'adhkar-completed-sections-v1'

function getTodayKey(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function AdhkarMain() {
  const { dict, locale } = useLanguage()
  const isRtl = locale === 'ar'

  const [completedIds, setCompletedIds] = useState<string[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(COMPLETED_SECTIONS_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as { date?: string; ids?: string[] }
      if (parsed.date === getTodayKey() && Array.isArray(parsed.ids)) {
        setCompletedIds(parsed.ids)
      } else {
        localStorage.removeItem(COMPLETED_SECTIONS_KEY)
      }
    } catch {
      // تجاهل أخطاء التخزين المحلي
    }
  }, [])

  const persistCompleted = (nextIds: string[]) => {
    setCompletedIds(nextIds)
    try {
      localStorage.setItem(
        COMPLETED_SECTIONS_KEY,
        JSON.stringify({ date: getTodayKey(), ids: nextIds }),
      )
    } catch {
      // تجاهل أخطاء التخزين المحلي
    }
  }

  const toggleSectionCompleted = (id: string) => {
    const exists = completedIds.includes(id)
    const next = exists
      ? completedIds.filter((item) => item !== id)
      : [...completedIds, id]
    persistCompleted(next)
  }

  const resetDailyProgress = () => {
    persistCompleted([])
  }

  const hisn = useMemo(
    () => ADHKAR.filter((c) => c.group === 'hisn'),
    [],
  )
  const hisnItems = useMemo(
    () => hisn.reduce((sum, c) => sum + c.items.length, 0),
    [hisn],
  )
  const ruqyah = useMemo(
    () => ADHKAR.find((c) => c.id === 'ruqyah'),
    [],
  )

  const morningCategory = useMemo(
    () =>
      ADHKAR.find(
        (c) =>
          c.id.toLowerCase().includes('morning') ||
          c.id.includes('sabah') ||
          c.title.includes('الصباح'),
      ),
    [],
  )

  const eveningCategory = useMemo(
    () =>
      ADHKAR.find(
        (c) =>
          c.id.toLowerCase().includes('evening') ||
          c.id.includes('masa') ||
          c.title.includes('المساء'),
      ),
    [],
  )

  const groups = useMemo(
    () =>
      ADHKAR_GROUPS.filter(
        (g) =>
          (g.id !== 'ruqyah' || !ruqyah) &&
          ADHKAR.some((c) => c.group === g.id),
      ),
    [ruqyah],
  )

  const keyCategories = useMemo(() => {
    const list: typeof ADHKAR = []
    if (morningCategory) list.push(morningCategory)
    if (eveningCategory) list.push(eveningCategory)
    if (ruqyah) list.push(ruqyah)
    return list
  }, [morningCategory, eveningCategory, ruqyah])

  const completedCount = keyCategories.filter((c) =>
    completedIds.includes(c.id),
  ).length
  const totalKeyCount = keyCategories.length
  const progressPercent =
    totalKeyCount > 0 ? Math.round((completedCount / totalKeyCount) * 100) : 0

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="min-h-screen bg-background pb-24 text-foreground"
    >
      <div className="container mx-auto max-w-4xl space-y-6 px-4 pb-6 pt-[max(1rem,env(safe-area-inset-top))]">
        <PageHeader
          title={dict.adhkarPage.title}
          subtitle={dict.adhkarPage.subtitle}
          action={
            <Suspense fallback={<div className="size-10" />}>
              <SearchButton />
            </Suspense>
          }
        />

        {/* شريط إنجاز الورد اليومي */}
        {totalKeyCount > 0 && (
          <section
            aria-label="متابعة الورد اليومي"
            className="rounded-3xl border border-border bg-card p-4 shadow-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-muted-foreground">
                  {isRtl ? 'إنجاز الأذكار الأساسية اليوم' : 'Today’s Core Adhkar'}
                </p>
                <p className="mt-0.5 text-base font-extrabold text-foreground">
                  {isRtl
                    ? `أنجزت ${toArabicNumber(completedCount)} من ${toArabicNumber(totalKeyCount)} (${toArabicNumber(progressPercent)}٪)`
                    : `${completedCount} of ${totalKeyCount} completed (${progressPercent}%)`}
                </p>
              </div>

              {completedCount > 0 && (
                <button
                  type="button"
                  onClick={resetDailyProgress}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-muted/70 px-3 py-1.5 text-xs font-bold text-foreground transition-colors hover:bg-muted"
                >
                  <RotateCcw className="size-3.5" />
                  <span>{isRtl ? 'إعادة ضبط' : 'Reset'}</span>
                </button>
              )}
            </div>

            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-foreground transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </section>
        )}

        {/* وصول سريع لأذكار الصباح والمساء */}
        {(morningCategory || eveningCategory) && (
          <section aria-label="أذكار الصباح والمساء" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {morningCategory && (
              <div className="flex items-center justify-between gap-2 rounded-3xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-foreground/30">
                <Link
                  href={`/adhkar/${morningCategory.id}`}
                  className="flex min-w-0 flex-1 items-center gap-3.5"
                >
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-border bg-muted/70 text-foreground">
                    <Sunrise className="size-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-base font-extrabold text-foreground">
                      {morningCategory.title}
                    </h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {toArabicNumber(morningCategory.items.length)} {dict.adhkarPage.dhikrCount}
                    </p>
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={() => toggleSectionCompleted(morningCategory.id)}
                  aria-label={morningCategory.title}
                  className={cn(
                    'flex size-10 shrink-0 items-center justify-center rounded-2xl border transition-colors',
                    completedIds.includes(morningCategory.id)
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border bg-transparent text-muted-foreground hover:text-foreground',
                  )}
                >
                  <CheckCircle2 className="size-5" />
                </button>
              </div>
            )}

            {eveningCategory && (
              <div className="flex items-center justify-between gap-2 rounded-3xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-foreground/30">
                <Link
                  href={`/adhkar/${eveningCategory.id}`}
                  className="flex min-w-0 flex-1 items-center gap-3.5"
                >
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-border bg-muted/70 text-foreground">
                    <Sunset className="size-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-base font-extrabold text-foreground">
                      {eveningCategory.title}
                    </h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {toArabicNumber(eveningCategory.items.length)} {dict.adhkarPage.dhikrCount}
                    </p>
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={() => toggleSectionCompleted(eveningCategory.id)}
                  aria-label={eveningCategory.title}
                  className={cn(
                    'flex size-10 shrink-0 items-center justify-center rounded-2xl border transition-colors',
                    completedIds.includes(eveningCategory.id)
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border bg-transparent text-muted-foreground hover:text-foreground',
                  )}
                >
                  <CheckCircle2 className="size-5" />
                </button>
              </div>
            )}
          </section>
        )}

        {/* المسبحة الإلكترونية */}
        <Link
          href="/tasbih"
          className="group flex items-center justify-between gap-4 rounded-3xl border border-border bg-card p-5 text-foreground shadow-sm transition-all hover:border-foreground/30 active:scale-[0.99]"
        >
          <div className="flex items-center gap-4">
            <div className="flex size-13 shrink-0 items-center justify-center rounded-2xl bg-foreground text-background">
              <CircleDashed className="size-7" strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-foreground">
                {dict.adhkarPage.tasbih}
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {dict.adhkarPage.tasbihDesc}
              </p>
            </div>
          </div>
          <ChevronLeft
            className={cn(
              'size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-[-2px]',
              !isRtl && 'rotate-180',
            )}
          />
        </Link>

        {/* آية متغيرة */}
        <AyahCard />

        {/* الأقسام الرئيسية */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Link
            href="/adhkar/hisn"
            className="group flex items-center gap-4 rounded-3xl border border-border bg-card p-5 text-start shadow-sm transition-all hover:border-foreground/30 hover:shadow-md"
          >
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-border bg-muted/70 text-foreground transition-transform group-hover:scale-105">
              <BookOpen className="size-7" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-extrabold text-foreground">
                {dict.adhkarPage.hisn}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {toArabicNumber(hisn.length)} {dict.adhkarPage.babCount} •{' '}
                {toArabicNumber(hisnItems)} {dict.adhkarPage.dhikrCount}
              </p>
            </div>
            <ChevronLeft
              className={cn(
                'size-5 shrink-0 text-muted-foreground',
                !isRtl && 'rotate-180',
              )}
            />
          </Link>

          {ruqyah && (
            <div className="flex items-center justify-between gap-2 rounded-3xl border border-border bg-card p-5 shadow-sm transition-all hover:border-foreground/30 hover:shadow-md">
              <Link
                href={`/adhkar/${ruqyah.id}`}
                className="group flex min-w-0 flex-1 items-center gap-4 text-start"
              >
                <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-border bg-muted/70 text-foreground transition-transform group-hover:scale-105">
                  <Shield className="size-7" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-extrabold text-foreground">
                    {dict.adhkarPage.ruqyah}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {toArabicNumber(ruqyah.items.length)} {dict.adhkarPage.dhikrCount}
                  </p>
                </div>
              </Link>

              <button
                type="button"
                onClick={() => toggleSectionCompleted(ruqyah.id)}
                aria-label={dict.adhkarPage.ruqyah}
                className={cn(
                  'flex size-10 shrink-0 items-center justify-center rounded-2xl border transition-colors',
                  completedIds.includes(ruqyah.id)
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border bg-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                <CheckCircle2 className="size-5" />
              </button>
            </div>
          )}
        </div>

        {/* مجموعات الأذكار */}
        <div className="mt-6 flex flex-col gap-8">
          {groups.map((g) => {
            let GroupIcon = Heart
            if (g.id === 'daily') {
              GroupIcon = Sun
            } else if (g.id === 'situations') {
              GroupIcon = Moon
            } else if (g.id === 'dua') {
              GroupIcon = Heart
            }

            const groupTitle =
              g.id === 'daily'
                ? dict.adhkarPage.daily
                : g.id === 'situations'
                  ? dict.adhkarPage.situations
                  : g.id === 'dua'
                    ? dict.adhkarPage.dua
                    : g.title

            const groupItems = ADHKAR.filter((c) => c.group === g.id)

            return (
              <section key={g.id} aria-labelledby={`g-${g.id}`}>
                <div className="mb-4 flex items-center justify-between border-b border-border pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-8 items-center justify-center rounded-xl border border-border bg-muted/70 text-foreground">
                      <GroupIcon className="size-4" />
                    </span>
                    <h2
                      id={`g-${g.id}`}
                      className="text-lg font-extrabold text-foreground"
                    >
                      {groupTitle}
                    </h2>
                  </div>
                  <span className="text-xs font-bold text-muted-foreground">
                    {toArabicNumber(groupItems.length)}
                  </span>
                </div>

                <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {groupItems.map((c) => (
                    <li key={c.id}>
                      <Link
                        href={`/adhkar/${c.id}`}
                        className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:border-foreground/30 hover:bg-muted/40"
                      >
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-muted text-sm font-extrabold text-foreground transition-colors group-hover:bg-foreground group-hover:text-background">
                          {toArabicNumber(c.items.length)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-base font-bold leading-snug text-foreground">
                            {c.title}
                          </span>
                          <span className="mt-0.5 line-clamp-1 block text-xs text-muted-foreground">
                            {c.description}
                          </span>
                        </span>
                        <ChevronLeft
                          className={cn(
                            'size-4 shrink-0 text-muted-foreground opacity-60 transition-transform group-hover:translate-x-[-2px] group-hover:opacity-100',
                            !isRtl && 'rotate-180',
                          )}
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )
          })}
        </div>

        {/* أسماء الله الحسنى */}
        <div className="mt-6">
          <Link
            href="/adhkar/asmaulhusna"
            className="group flex items-center justify-between gap-4 rounded-3xl border border-border bg-card p-5 text-foreground shadow-sm transition-all hover:border-foreground/30 active:scale-[0.99]"
          >
            <div className="flex items-center gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-foreground text-background">
                <Star className="size-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-foreground">
                  {dict.adhkarPage.asmaulHusna}
                </h3>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {dict.adhkarPage.asmaulHusnaDesc}
                </p>
              </div>
            </div>
            <ChevronLeft
              className={cn(
                'size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-[-2px]',
                !isRtl && 'rotate-180',
              )}
            />
          </Link>
        </div>

        <p className="mt-8 rounded-2xl border border-border bg-card p-4 text-center text-[11px] leading-relaxed text-muted-foreground">
          {dict.adhkarPage.footer}
        </p>
      </div>
    </div>
  )
}
