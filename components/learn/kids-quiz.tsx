'use client'

import { useEffect, useState, useRef } from 'react'
import { PartyPopper, RotateCcw } from 'lucide-react'
import type { QuizQuestion } from '@/lib/learn'
import { pickQuizRound } from '@/lib/kids-quiz-pool'
import { toArabicNumber } from '@/lib/quran'
import { cn } from '@/lib/utils'

export function KidsQuiz() {
  const [round, setRound] = useState<QuizQuestion[]>([])
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setRound(pickQuizRound())
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  if (round.length === 0) {
    return <div className="h-[250px] animate-pulse rounded-3xl bg-card" aria-hidden="true" />
  }

  const finished = index >= round.length

  if (finished) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-3xl bg-gold/20 p-6 py-10 text-center">
        <PartyPopper className="size-12 text-primary" aria-hidden="true" />
        <p className="text-xl font-bold">{`أحسنت! نتيجتك ${toArabicNumber(score)} من ${toArabicNumber(round.length)}`}</p>
        <button
          type="button"
          onClick={() => {
            setRound(pickQuizRound())
            setIndex(0)
            setScore(0)
            setPicked(null)
          }}
          className="mt-2 flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground shadow-md hover:bg-primary/90 transition-colors"
        >
          <RotateCcw className="size-4" aria-hidden="true" />
          {'العب مرة أخرى'}
        </button>
      </div>
    )
  }

  const q = round[index]
  const choose = (i: number) => {
    if (picked !== null) return
    setPicked(i)
    if (i === q.answer) setScore((s) => s + 1)
    
    timeoutRef.current = setTimeout(() => {
      setPicked(null)
      setIndex((x) => x + 1)
    }, 1100)
  }

  return (
    <div className="rounded-3xl bg-card p-5 shadow-sm ring-1 ring-border flex flex-col">
      <p className="text-xs text-muted-foreground">{`سؤال ${toArabicNumber(index + 1)} من ${toArabicNumber(round.length)}`}</p>
      <p className="mt-3 mb-4 text-lg font-bold leading-relaxed">{q.q}</p>
      <div className="grid gap-2" role="group" aria-label="الخيارات">
        {q.options.map((o, i) => {
          const isCorrect = picked !== null && i === q.answer
          const isWrong = picked === i && i !== q.answer
          return (
            <button
              key={o}
              type="button"
              onClick={() => choose(i)}
              disabled={picked !== null}
              className={cn(
                'rounded-2xl border-2 px-4 py-3 text-right font-medium transition-all duration-300',
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
    </div>
  )
}