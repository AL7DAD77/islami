'use client'

import { useState } from 'react'
import { PartyPopper, RotateCcw } from 'lucide-react'
import { KIDS_QUIZ } from '@/lib/learn'
import { toArabicNumber } from '@/lib/quran'
import { cn } from '@/lib/utils'

export function KidsQuiz() {
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const finished = index >= KIDS_QUIZ.length

  if (finished) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl bg-gold/20 p-6 text-center">
        <PartyPopper className="size-10 text-primary" aria-hidden="true" />
        <p className="text-xl font-bold">{`أحسنت! نتيجتك ${toArabicNumber(score)} من ${toArabicNumber(KIDS_QUIZ.length)}`}</p>
        <button
          type="button"
          onClick={() => {
            setIndex(0)
            setScore(0)
            setPicked(null)
          }}
          className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground"
        >
          <RotateCcw className="size-4" aria-hidden="true" />
          {'العب مرة أخرى'}
        </button>
      </div>
    )
  }

  const q = KIDS_QUIZ[index]
  const choose = (i: number) => {
    if (picked !== null) return
    setPicked(i)
    if (i === q.answer) setScore((s) => s + 1)
    setTimeout(() => {
      setPicked(null)
      setIndex((x) => x + 1)
    }, 1100)
  }

  return (
    <div className="rounded-3xl bg-card p-5 shadow-sm ring-1 ring-border">
      <p className="text-xs text-muted-foreground">{`سؤال ${toArabicNumber(index + 1)} من ${toArabicNumber(KIDS_QUIZ.length)}`}</p>
      <p className="mt-2 text-lg font-bold">{q.q}</p>
      <div className="mt-4 grid gap-2" role="group" aria-label="الخيارات">
        {q.options.map((o, i) => {
          const isCorrect = picked !== null && i === q.answer
          const isWrong = picked === i && i !== q.answer
          return (
            <button
              key={o}
              type="button"
              onClick={() => choose(i)}
              className={cn(
                'rounded-2xl border-2 px-4 py-3 text-right font-medium transition-colors',
                isCorrect && 'border-primary bg-primary text-primary-foreground',
                isWrong && 'border-destructive bg-destructive/10 text-destructive',
                !isCorrect && !isWrong && 'border-border hover:bg-muted',
              )}
            >
              {o}
            </button>
          )
        })}
      </div>
      <p className="sr-only" aria-live="polite">
        {picked !== null ? (picked === q.answer ? 'إجابة صحيحة' : 'إجابة خاطئة') : ''}
      </p>
    </div>
  )
}
