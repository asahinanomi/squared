import { useEffect, useRef } from 'react'
import type { Days } from '../lib/days'
import { drawPainting } from '../lib/painting'

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

/** A month's painting, small: beside its name in the month view, and on the gallery wall. */
export function PaintingThumb({ month, days, name = '', className }: Props) {
  const art = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = art.current
    if (!c) return
    let cancelled = false
    let idle = 0
    // Painted only once it's on screen, and after the zoom that brought it has settled: never in the way of a tap.
    const paint = () => {
      const px = Math.round(c.clientWidth * (window.devicePixelRatio || 1))
      if (!px) return
      const key = keyOf(month, days, name, px)
      const done = drawn.get(key)
      if (done) {
        c.width = c.height = px
        c.getContext('2d')!.drawImage(done, 0, 0)
        return
      }
      idle = window.setTimeout(async () => {
        if (cancelled) return
        const off = document.createElement('canvas')
        await drawPainting(off, month, days, name, px)
        if (cancelled) return
        drawn.set(key, off)
        c.width = c.height = px
        c.getContext('2d')!.drawImage(off, 0, 0)
      }, 380)
    }
    const seen = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        seen.disconnect()
        paint()
      }
    })
    seen.observe(c)
    return () => {
      cancelled = true
      clearTimeout(idle)
      seen.disconnect()
    }
  }, [month, days, name])
  return <canvas ref={art} className={className} aria-hidden="true" />
}
