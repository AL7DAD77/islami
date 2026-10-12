import type { Metadata } from 'next'
import { ChevronDown } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { PROPHETS } from '@/lib/prophets'
import { toArabicNumber } from '@/lib/quran'

export const metadata: Metadata = { title: 'قصص الأنبياء | إسلامي' }

export default function ProphetsPage() {
  return (
    <>
      <PageHeader
        title="قصص الأنبياء"
        subtitle={`نبذة مختصرة عن الأنبياء الـ${toArabicNumber(PROPHETS.length)} المذكورين في القرآن الكريم`}
        backHref="/more"
      />

      <div className="flex flex-col gap-3">
        {PROPHETS.map((p, i) => (
          <details key={p.id} className="group rounded-2xl bg-card shadow-sm ring-1 ring-border">
            <summary className="flex cursor-pointer list-none items-center gap-3 p-4 [&::-webkit-details-marker]:hidden">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground">
                {toArabicNumber(i + 1)}
              </span>
              <span className="flex-1">
                <span className="block font-bold">{`${p.name} ${p.id === 'muhammad' ? '' : 'عليه السلام'}`.trim()}</span>
                {p.title && <span className="text-xs text-muted-foreground">{p.title}</span>}
              </span>
              <ChevronDown
                className="size-5 text-muted-foreground transition-transform group-open:rotate-180"
                aria-hidden="true"
              />
            </summary>
            <p className="border-t p-4 leading-loose">{p.summary}</p>
          </details>
        ))}
      </div>

      <p className="mt-8 text-center text-xs leading-relaxed text-muted-foreground">
        {'نبذ مختصرة مأخوذة من القرآن الكريم وكتب التفسير وقصص الأنبياء.'}
      </p>
    </>
  )
}
