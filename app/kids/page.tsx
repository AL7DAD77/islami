import Link from 'next/link'
import type { Metadata } from 'next'
import { PageHeader } from '@/components/page-header'
import { LessonList } from '@/components/learn/lesson-list'
import { KidsQuiz } from '@/components/learn/kids-quiz'
import { KIDS_LESSONS, SHORT_SURAHS } from '@/lib/learn'
import { KIDS_DUAS } from '@/lib/kids-duas'
import { ARABIC_LETTERS } from '@/lib/kids-letters'

export const metadata: Metadata = { title: 'ركن الأطفال | إسلامي' }

export default function KidsPage() {
  return (
    <div className="min-h-[100dvh] bg-background pb-24 flex flex-col gap-8" dir="rtl">
      <PageHeader title="ركن الأطفال" subtitle="نتعلم ديننا بحب ومتعة" backHref="/more" />
      
      {/* ============ 1. قصار السور ============ */}
      <section aria-labelledby="memorize">
        <h2 id="memorize" className="mb-3 font-bold text-lg text-primary">
          {'📖 احفظ قصار السور'}
        </h2>
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {SHORT_SURAHS.map((s) => (
            <li key={s.number}>
              <Link
                href={`/quran/${s.number}`}
                className="flex h-16 items-center justify-center rounded-2xl bg-accent font-quran text-xl text-accent-foreground shadow-sm hover:bg-gold/30 transition-colors"
              >
                {s.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ============ 2. الاختبار (تم نقله للأعلى) ============ */}
      <section aria-labelledby="quiz">
        <h2 id="quiz" className="mb-3 font-bold text-lg text-primary">
          {'🏆 اختبر معلوماتك'}
        </h2>
        <KidsQuiz />
      </section>

      {/* ============ 3. الأدعية اليومية ============ */}
      <section aria-labelledby="duas">
        <h2 id="duas" className="mb-3 font-bold text-lg text-primary">
          {'🤲 أدعية صغيرة أحفظها'}
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {KIDS_DUAS.map((d) => (
            <li
              key={d.id}
              className="rounded-2xl bg-card p-4 shadow-sm ring-1 border-border"
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">{d.emoji}</span>
                <p className="text-xs font-medium text-muted-foreground">{d.occasion}</p>
              </div>
              <p className="mt-2 font-quran text-lg leading-relaxed">{d.text}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* ============ 4. الحروف العربية ============ */}
      <section aria-labelledby="letters">
        <h2 id="letters" className="mb-3 font-bold text-lg text-primary">
          {'🔤 الحروف العربية'}
        </h2>
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
          {ARABIC_LETTERS.map((l) => (
            <li
              key={l.letter}
              className="flex flex-col items-center gap-1 rounded-2xl bg-emerald-50 p-3 shadow-sm ring-1 ring-emerald-200 dark:bg-emerald-950 dark:ring-emerald-800"
            >
              <span className="text-4xl">{l.emoji}</span>
              <span className="font-quran text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                {l.letter}
              </span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400">
                {l.word}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* ============ 5. الدروس (تم نقلها للأسفل) ============ */}
      <section aria-labelledby="lessons">
        <h2 id="lessons" className="mb-3 font-bold text-lg text-primary">
          {'📚 دروس مصورة'}
        </h2>
        <LessonList lessons={KIDS_LESSONS} />
      </section>
      
    </div>
  )
}