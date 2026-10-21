import { useEffect, useRef } from 'react'
import type { Days } from '../lib/days'
import { drawPainting } from '../lib/painting'

type Props = { month: string; days: Days; name?: string; className?: string }

/** A month's painting, small: beside its name in the month view, and on the gallery wall. */
export function PaintingThumb({ month, days, name = '', className }: Props) {
  const art = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = art.current
    if (c) drawPainting(c, month, days, name, Math.round(c.clientWidth * (window.devicePixelRatio || 1)))
  }, [month, days, name])
  return <canvas ref={art} className={className} aria-hidden="true" />
}
