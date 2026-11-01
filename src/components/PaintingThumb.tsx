import { useEffect, useRef } from 'react'
import type { Days } from '../lib/days'
import { drawBlank, drawPainting } from '../lib/painting'

type Props = { month: string; days: Days; name?: string; className?: string }

// Paintings already drawn, by what they show (the period, its days' colours, the size): a thumbnail that comes back
// (zooming out again, scrolling back) is copied, never painted again. Painting one is thousands of soft dabs.
const drawn = new Map<string, HTMLCanvasElement>()
const keyOf = (month: string, days: Days, name: string, px: number) =>
  [
    month,
    name,
    px,
    ...Object.keys(days)
      .filter((d) => d.startsWith(month))
      .sort()
      .map((d) => d + days[d].color + (days[d].framed ? 'f' : '')),
  ].join('|')

// Paintings still to draw, one at a time, in the order they came into view (the top of the page first), each with a
// breath between so the page stays free to scroll and tap (nomi, Nov 1, 2026: a full wall appeared all at once,
// seconds late).
let queue: Promise<void> = Promise.resolve()
const next = (job: () => Promise<void>) => (queue = queue.then(job, job))

/** Fade a finished painting in over its empty frame. */
function fadeIn(c: HTMLCanvasElement, blank: HTMLCanvasElement, art: HTMLCanvasElement) {
  const ctx = c.getContext('2d')!
  const t0 = performance.now()
  const step = (now: number) => {
    const t = Math.min(1, (now - t0) / 360)
    ctx.globalAlpha = 1
    ctx.drawImage(blank, 0, 0)
    ctx.globalAlpha = t
    ctx.drawImage(art, 0, 0)
    ctx.globalAlpha = 1
    if (t < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

/** A month's painting, small: beside its name in the month view, and on the gallery wall. Its empty frame shows at
 *  once; the painting fades in when it's drawn. */
export function PaintingThumb({ month, days, name = '', className }: Props) {
  const art = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = art.current
    if (!c) return
    let cancelled = false
    let px = 0
    let key = ''
    const blank = document.createElement('canvas')
    // Its size (once it's laid out); drawn before: at once; else its empty frame, so the page has its shape at once.
    const ready = () => {
      if (px) return true
      px = Math.round(c.clientWidth * (window.devicePixelRatio || 1))
      if (!px) return false
      key = keyOf(month, days, name, px)
      c.width = c.height = px
      const done = drawn.get(key)
      if (done) c.getContext('2d')!.drawImage(done, 0, 0)
      else {
        drawBlank(blank, month, px)
        c.getContext('2d')!.drawImage(blank, 0, 0)
      }
      return true
    }
    ready()
    // Painted only once it's on screen, and after the zoom that brought it has settled: never in the way of a tap.
    const paint = () => {
      if (!ready() || drawn.has(key)) return
      const wait = window.setTimeout(
        () =>
          next(async () => {
            if (cancelled) return
            const off = document.createElement('canvas')
            await drawPainting(off, month, days, name, px)
            drawn.set(key, off)
            if (!cancelled) fadeIn(c, blank, off)
            await new Promise((r) => setTimeout(r, 16)) // a breath before the next
          }),
        380,
      )
      cleanup = () => clearTimeout(wait)
    }
    let cleanup = () => {}
    const seen = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        seen.disconnect()
        paint()
      }
    })
    seen.observe(c)
    return () => {
      cancelled = true
      cleanup()
      seen.disconnect()
    }
  }, [month, days, name])
  return <canvas ref={art} className={className} aria-hidden="true" />
}
