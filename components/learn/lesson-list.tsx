import { ChevronDown } from 'lucide-react'
import type { Lesson } from '@/lib/learn'

export function LessonList({ lessons }: { lessons: Lesson[] }) {
  return (
    <div className="flex flex-col gap-3">
      {lessons.map((l) => (
        <details key={l.id} className="group rounded-2xl bg-card shadow-sm ring-1 ring-border">
          <summary className="flex cursor-pointer list-none items-center gap-3 p-4 [&::-webkit-details-marker]:hidden">
            <span className="flex-1">
              <span className="block font-bold">{l.title}</span>
              <span className="text-xs text-muted-foreground">{l.summary}</span>
            </span>
            <ChevronDown className="size-5 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <ol className="flex flex-col gap-3 border-t p-4">
            {l.steps.map((s) => (
              <li key={s.title} className="rounded-xl bg-muted/50 p-3">
                <p className="font-bold text-primary">{s.title}</p>
                <p className="mt-1 text-sm leading-relaxed">{s.body}</p>
              </li>
            ))}
          </ol>
          <p className="px-4 pb-4 text-xs text-muted-foreground">{`المصدر: ${l.source}`}</p>
        </details>
      ))}
    </div>
  )
}
