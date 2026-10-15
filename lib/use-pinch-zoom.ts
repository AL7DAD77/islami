'use client'

import { useEffect, useRef, useState } from 'react'
import { attachPinchZoom } from '@/lib/pinch-zoom'

/** يربط التكبير بإصبعين بعنصر، ويعيد الحجم الحالي. الحجم يُحفظ عند رفع الإصبعين فقط. */
export function usePinchZoom<T extends HTMLElement>(
  committed: number,
  commit: (value: number) => void,
  deps: readonly unknown[] = [],
  min = 16,
  max = 56,
) {
  const ref = useRef<T | null>(null)
  const [live, setLive] = useState<number | null>(null)
  const current = live ?? committed

  const currentRef = useRef(current)
  currentRef.current = current
  const commitRef = useRef(commit)
  commitRef.current = commit

  useEffect(() => {
    const el = ref.current
    if (!el) return
    return attachPinchZoom(el, {
      get: () => currentRef.current,
      set: (v) => {
        currentRef.current = v
        setLive(v)
      },
      onEnd: (v) => {
        commitRef.current(v)
        setLive(null)
      },
      min,
      max,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [min, max, ...deps])

  return { ref, size: current, live }
}
