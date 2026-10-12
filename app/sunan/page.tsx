import type { Metadata } from 'next'
import { ChevronDown } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { FORGOTTEN_SUNAN, RAWATIB, RAWATIB_HADITH, RAWATIB_SOURCE } from '@/lib/sunan'
import { toArabicNumber } from '@/lib/quran'

export const metadata: Metadata = { title: 'السنن المستحبة في اليوم والليلة | إسلامي' }

export default function SunanPage() {
  const total = RAWATIB.reduce((n, r) => n + r.rakaat, 0)

  return (
    <>
      <PageHeader
        title="السنن المستحبة في اليوم والليلة"
        subtitle="السنن الرواتب وأهم السنن المهجورة"
        backHref="/more"
      />

      <div className="flex flex-col gap-8">
        {/* ============ السنن الرواتب ============ */}
        <section aria-labelledby="rawatib">
          <h2 id="rawatib" className="mb-3 font-bold">
            {`🕌 السنن الرواتب (${toArabicNumber(total)} ركعة)`}
          </h2>

          <div className="rounded-2xl bg-gradient-to-l from-emerald-600 to-emerald-700 p-4 text-white shadow-sm">
            <p className="font-quran text-lg leading-loose">{`«${RAWATIB_HADITH}»`}</p>
            <p className="mt-2 text-xs opacity-80">{RAWATIB_SOURCE}</p>
          </div>

          <ul className="mt-3 flex flex-col gap-2">
            {RAWATIB.map((r) => (
              <li key={r.id} className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border">
                <div className="flex items-center gap-3">
                  <span className="flex size-12 shrink-0 flex-col items-center justify-center rounded-xl bg-accent text-accent-foreground">
                    <span className="text-lg font-bold leading-none">{toArabicNumber(r.rakaat)}</span>
                    <span className="text-[10px]">{'ركعات'}</span>
                  </span>
                  <div className="flex-1">
                    <p className="font-bold">{`سنة ${r.prayer}`}</p>
                    <p className="text-xs text-muted-foreground">{r.position}</p>
                  </div>
                </div>
                {r.note && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{r.note}</p>}
              </li>
            ))}
          </ul>
        </section>

        {/* ============ السنن المهجورة ============ */}
        <section aria-labelledby="forgotten">
          <h2 id="forgotten" className="mb-1 font-bold">
            {'🌱 أهم السنن المهجورة'}
          </h2>
          <p className="mb-3 text-xs text-muted-foreground">
            {'سنن ثابتة قلّ من يعمل بها، فأحيِها تُؤجر على إحيائها. اضغط على السنة لقراءة دليلها.'}
          </p>

          <div className="flex flex-col gap-3">
            {FORGOTTEN_SUNAN.map((s, i) => (
              <details key={s.id} className="group rounded-2xl bg-card shadow-sm ring-1 ring-border">
                <summary className="flex cursor-pointer list-none items-center gap-3 p-4 [&::-webkit-details-marker]:hidden">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground">
                    {toArabicNumber(i + 1)}
                  </span>
                  <span className="flex-1 font-bold">{s.title}</span>
                  <ChevronDown
                    className="size-5 text-muted-foreground transition-transform group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>
                <div className="border-t p-4">
                  <p className="font-quran text-lg leading-loose">{s.hadith}</p>
                  {s.note && <p className="mt-2 rounded-xl bg-muted/50 p-3 text-sm leading-relaxed">{s.note}</p>}
                  <p className="mt-2 text-xs text-muted-foreground">{`المصدر: ${s.source}`}</p>
                </div>
              </details>
            ))}
          </div>
        </section>
      </div>

      <p className="mt-8 text-center text-xs leading-relaxed text-muted-foreground">
        {'النصوص منقولة مع تخريجها كما وردت في مصادرها. وللاستزادة أو التثبت من درجة الحديث يُرجع إلى أهل العلم.'}
      </p>
    </>
  )
}
