import { useCallback, useState, type RefObject } from 'react'

/** Glide a scroll box to `to` (eased, about half a second, however far away it is). */
export function glide(el: HTMLElement, to: number, done?: () => void) {
  const from = el.scrollTop
  const dist = Math.max(0, Math.min(el.scrollHeight - el.clientHeight, to)) - from
  const ms = 520
  const t0 = performance.now()
  const step = (now: number) => {
    const p = Math.min(1, (now - t0) / ms)
    el.scrollTop = from + dist * (1 - Math.pow(1 - p, 3))
    if (p < 1) requestAnimationFrame(step)
    else done?.()
  }
  requestAnimationFrame(step)
}

/** A gentle pulse on an element, so the eye lands on it. */
export function pulse(target: HTMLElement) {
  target.classList.remove('is-pulse')
  void target.offsetWidth // restart the animation
  target.classList.add('is-pulse')
  target.addEventListener('animationend', () => target.classList.remove('is-pulse'), { once: true })
}

/**
 * "today" for a scrolling list of elements: whether today's mark (`selector`) has scrolled out of
 * view, and a way back to it — glide it to the middle, then pulse it. Call `check` on scroll.
 */
export function useBackToToday(scroller: RefObject<HTMLElement | null>, selector: string) {
  const [away, setAway] = useState(false)
  const find = () => {
    const el = scroller.current
    const mark = el?.querySelector<HTMLElement>(selector)
    return el && mark ? { el, mark, a: el.getBoundingClientRect(), b: mark.getBoundingClientRect() } : null
  }
  const check = useCallback(() => {
    const f = find()
    setAway(!!f && (f.b.bottom < f.a.top || f.b.top > f.a.bottom))
  }, [selector]) // eslint-disable-line react-hooks/exhaustive-deps
  const back = () => {
    const f = find()
    if (!f) return
    glide(f.el, f.el.scrollTop + f.b.top - f.a.top - (f.a.height - f.b.height) / 2, () => pulse(f.mark))
  }
  return { away, check, back }
}
