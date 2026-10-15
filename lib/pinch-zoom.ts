/**
 * تكبير وتصغير النص بإصبعين.
 * - يعمل فقط عند وجود إصبعين، فلا يتعارض مع السحب بإصبع واحد (التنقل بين الصفحات والسور).
 * - يمنع تكبير الصفحة كلها داخل المنطقة المحددة، ويكتفي بتغيير حجم النص.
 */
export interface PinchOptions {
  get: () => number
  set: (value: number) => void
  onEnd?: (value: number) => void
  min?: number
  max?: number
}

function distance(a: Touch, b: Touch) {
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
}

export function attachPinchZoom(el: HTMLElement, o: PinchOptions): () => void {
  const min = o.min ?? 16
  const max = o.max ?? 56
  let active = false
  let startDist = 0
  let baseSize = 0

  const onStart = (e: TouchEvent) => {
    if (e.touches.length === 2) {
      active = true
      startDist = distance(e.touches[0], e.touches[1])
      baseSize = o.get()
    }
  }

  const onMove = (e: TouchEvent) => {
    if (!active || e.touches.length !== 2 || startDist <= 0) return
    e.preventDefault()
    const ratio = distance(e.touches[0], e.touches[1]) / startDist
    const next = Math.round(Math.min(max, Math.max(min, baseSize * ratio)))
    if (next !== o.get()) o.set(next)
  }

  const onEnd = (e: TouchEvent) => {
    if (active && e.touches.length < 2) {
      active = false
      o.onEnd?.(o.get())
    }
  }

  el.addEventListener('touchstart', onStart, { passive: true })
  el.addEventListener('touchmove', onMove, { passive: false })
  el.addEventListener('touchend', onEnd, { passive: true })
  el.addEventListener('touchcancel', onEnd, { passive: true })

  return () => {
    el.removeEventListener('touchstart', onStart)
    el.removeEventListener('touchmove', onMove)
    el.removeEventListener('touchend', onEnd)
    el.removeEventListener('touchcancel', onEnd)
  }
}
