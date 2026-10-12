'use client'

import { useEffect, useRef } from 'react'

export type SwipeDirection = 'left' | 'right'

interface Options {
  onSwipe: (dir: SwipeDirection) => void
  enabled?: boolean
  /** أقل مسافة أفقية بالبكسل (تُرفع تلقائياً إلى ٢٥٪ من عرض الشاشة) */
  minDistance?: number
  /** أقصى مدة للإيماءة بالمللي ثانية */
  maxDuration?: number
}

/** عناصر لا نلتقط منها السحب أبداً: شرائح التحكم، حقول الإدخال، الوسائط، وكل ما وُسم data-no-swipe */
const BLOCKED = 'input, textarea, select, audio, video, canvas, [role="slider"], [data-no-swipe]'

/** هل العنصر (أو أي أب له) يمرَّر أفقياً؟ مثل صفحات المصحف والجداول الواسعة */
function insideHorizontalScroller(el: Element | null): boolean {
  let node: Element | null = el
  while (node && node !== document.body && node !== document.documentElement) {
    if (node instanceof HTMLElement && node.scrollWidth > node.clientWidth + 2) {
      const ox = getComputedStyle(node).overflowX
      if (ox === 'auto' || ox === 'scroll') return true
    }
    node = node.parentElement
  }
  return false
}

/**
 * كاشف سحب أفقي واحد لكل التطبيق، يتجنب التداخل مع:
 * - التمرير العمودي (تُلغى الإيماءة بمجرد أن يغلب الحركة العمودية)
 * - حواف الشاشة (إيماءة الرجوع في أندرويد)
 * - العناصر التي تُمرَّر أفقياً أو تتفاعل باللمس (شرائح، حقول، صفحات المصحف)
 * - اللمس بإصبعين (تكبير) وتحديد النص
 */
export function useHorizontalSwipe({ onSwipe, enabled = true, minDistance = 90, maxDuration = 600 }: Options) {
  const handler = useRef(onSwipe)
  handler.current = onSwipe

  useEffect(() => {
    if (!enabled) return

    let active = false
    let startX = 0
    let startY = 0
    let startTime = 0

    const onStart = (e: TouchEvent) => {
      active = false
      if (e.touches.length !== 1) return
      const t = e.touches[0]
      const edge = 28
      if (t.clientX < edge || t.clientX > window.innerWidth - edge) return
      const target = e.target as Element | null
      if (target?.closest?.(BLOCKED)) return
      if (insideHorizontalScroller(target)) return
      if (window.getSelection()?.toString()) return
      active = true
      startX = t.clientX
      startY = t.clientY
      startTime = Date.now()
    }

    const onMove = (e: TouchEvent) => {
      if (!active) return
      if (e.touches.length !== 1) {
        active = false
        return
      }
      const t = e.touches[0]
      const dx = Math.abs(t.clientX - startX)
      const dy = Math.abs(t.clientY - startY)
      // المستخدم يمرّر عمودياً: ألغِ الإيماءة فوراً
      if (dy > 24 && dy > dx * 0.6) active = false
    }

    const onEnd = (e: TouchEvent) => {
      if (!active) return
      active = false
      const t = e.changedTouches[0]
      const dx = t.clientX - startX
      const dy = t.clientY - startY
      const duration = Date.now() - startTime

      const needed = Math.max(minDistance, window.innerWidth * 0.25)
      if (duration > maxDuration) return
      if (Math.abs(dx) < needed) return
      if (Math.abs(dy) > Math.abs(dx) * 0.4) return

      handler.current(dx > 0 ? 'right' : 'left')
    }

    const cancel = () => {
      active = false
    }

    document.addEventListener('touchstart', onStart, { passive: true })
    document.addEventListener('touchmove', onMove, { passive: true })
    document.addEventListener('touchend', onEnd, { passive: true })
    document.addEventListener('touchcancel', cancel, { passive: true })
    return () => {
      document.removeEventListener('touchstart', onStart)
      document.removeEventListener('touchmove', onMove)
      document.removeEventListener('touchend', onEnd)
      document.removeEventListener('touchcancel', cancel)
    }
  }, [enabled, minDistance, maxDuration])
}
