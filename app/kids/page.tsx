import Link from 'next/link'
import type { Metadata } from 'next'
import { PageHeader } from '@/components/page-header'
import { LessonList } from '@/components/learn/lesson-list'
import { KidsQuiz } from '@/components/learn/kids-quiz'
import { KIDS_LESSONS, SHORT_SURAHS } from '@/lib/learn'

export const metadata: Metadata = { title: 'ركن الأطفال | نور' }

export default function KidsPage() {
  return (
    <>
      <PageHeader title="ركن الأطفال" subtitle="نتعلم ديننا بحب ومتعة" backHref="/more" />
      <div className="flex flex-col gap-6">
        <section aria-labelledby="memorize">
          <h2 id="memorize" className="mb-3 font-bold">
            {'احفظ قصار السور'}
          </h2>
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {SHORT_SURAHS.map((s) => (
              <li key={s.number}>
                <Link
                  href={`/quran/${s.number}`}
                  className="flex h-16 items-center justify-center rounded-2xl bg-accent font-quran text-xl text-accent-foreground shadow-sm hover:bg-gold/30"
                >
                  {s.name}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">{'افتح السورة واضغط تشغيل للاستماع والترديد مع القارئ.'}</p>
        </section>
        <section aria-labelledby="lessons">
          <h2 id="lessons" className="mb-3 font-bold">
            {'دروس'}
          </h2>
          <LessonList lessons={KIDS_LESSONS} />
        </section>
        <section aria-labelledby="quiz">
          <h2 id="quiz" className="mb-3 font-bold">
            {'اختبر معلوماتك'}
          </h2>
          <KidsQuiz />
        </section>
      </div>
    </>
  )
}
