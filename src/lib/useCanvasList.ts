import { useEffect, useLayoutEffect, useRef, useState } from 'react'

export type Paint2D = (ctx: CanvasRenderingContext2D, top: number, w: number, h: number) => void

/**
 * A tall scrolling list drawn on one screen-sized canvas: the canvas sticks to the top of the
 * scroll box and repaints only what's in view, once per frame. The box is sized by the page;
 * `paint` gets the current scroll offset and the box size. `openAt` gives the scroll offset to
 * open on (once, on arrival — the app never remembers where you scrolled).
 */
export function useCanvasList(paint: Paint2D, openAt: (w: number, h: number) => number) {
  const scroller = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const paintRef = useRef(paint)
  paintRef.current = paint

  const draw = () => {
    const cv = canvas.current
    const el = scroller.current
    if (!cv || !el || !size.w) return
    const dpr = window.devicePixelRatio || 1
    const ctx = cv.getContext('2d')!
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, size.w, size.h)
    paintRef.current(ctx, el.scrollTop, size.w, size.h)
  }

  useLayoutEffect(() => {
    const el = scroller.current
    if (!el) return
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight })
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Resize the canvas backing store (sharp on high-density screens) and repaint.
  useLayoutEffect(() => {
    const cv = canvas.current
    if (!cv || !size.w) return
    const dpr = window.devicePixelRatio || 1
    cv.width = Math.round(size.w * dpr)
    cv.height = Math.round(size.h * dpr)
    draw()
  })

  const opened = useRef(false)
  useLayoutEffect(() => {
    const el = scroller.current
    if (!el || !size.w || opened.current) return
    opened.current = true
    el.scrollTop = openAt(size.w, size.h)
    draw()
  })

  const frame = useRef(0)
  const onScroll = () => {
    cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(draw)
  }
  useEffect(() => () => cancelAnimationFrame(frame.current), [])

  return { scroller, canvas, size, onScroll }
}

/** Rounded rectangle path (falls back to a plain one where roundRect isn't supported). */
export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r)
  else ctx.rect(x, y, w, h)
}
