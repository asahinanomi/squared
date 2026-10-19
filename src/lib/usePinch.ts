import { useEffect, useRef } from 'react'

export type Focal = { x: number; y: number }
/** Returns false when there's nothing further that way (the view springs back). */
type PinchHandler = (at: Focal) => boolean | void

type Handlers = { onIn?: PinchHandler; onOut?: PinchHandler }

const IN = 1.2 // spread fingers this much to zoom in a notch…
const OUT = 1 / 1.2 // …or pinch this much to zoom out

/**
 * Two-finger pinch anywhere in the app (and a trackpad pinch on desktop). While the fingers move,
 * the current view scales under them; on release it either moves one notch in or out, or eases back.
 * The phone's own page zoom is switched off so this one is the only zoom.
 * `target` finds the element to scale (the current zoom level's stage).
 */
export function usePinch(target: () => HTMLElement | null, handlers: Handlers) {
  const live = useRef(handlers)
  live.current = handlers

  useEffect(() => {
    let start: { d: number; mid: Focal } | null = null
    let scale = 1
    let el: HTMLElement | null = null

    const dist = (t: TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY)
    const mid = (t: TouchList): Focal => ({
      x: (t[0].clientX + t[1].clientX) / 2,
      y: (t[0].clientY + t[1].clientY) / 2,
    })

    const settle = (from: number) => {
      const node = el
      if (!node) return
      node.style.transform = `scale(${from})`
      void node.offsetWidth // apply it before animating back
      node.style.transition = 'transform 0.22s cubic-bezier(0.2, 0.8, 0.2, 1)'
      node.style.transform = ''
      setTimeout(() => (node.style.transition = ''), 240)
    }

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 2) return
      e.preventDefault()
      el = target()
      start = { d: dist(e.touches), mid: mid(e.touches) }
      scale = 1
      if (el) {
        const box = el.getBoundingClientRect()
        el.style.transition = ''
        el.style.transformOrigin = `${start.mid.x - box.left}px ${start.mid.y - box.top}px`
      }
    }
    const onMove = (e: TouchEvent) => {
      if (!start || e.touches.length !== 2) return
      e.preventDefault()
      scale = Math.min(2, Math.max(0.5, dist(e.touches) / start.d))
      if (el) el.style.transform = `scale(${scale})`
    }
    const onEnd = (e: TouchEvent) => {
      if (!start || e.touches.length >= 2) return
      const at = start.mid
      start = null
      const h = live.current
      const handler = scale >= IN ? h.onIn : scale <= OUT ? h.onOut : undefined
      // Unscale first, so the next view measures itself at its real size…
      if (el) {
        el.style.transition = ''
        el.style.transform = ''
      }
      const fired = handler ? handler(at) : false
      // …and if nothing happened, ease back from where the fingers left it.
      if (fired === false) settle(scale)
      el = null
    }

    // Trackpad pinch (desktop browsers report it as a ctrl + wheel).
    let acc = 0
    let rest = 0
    let cool = 0
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return
      e.preventDefault()
      if (Date.now() < cool) return
      acc -= e.deltaY
      clearTimeout(rest)
      rest = window.setTimeout(() => (acc = 0), 250)
      if (Math.abs(acc) < 60) return
      const at = { x: e.clientX, y: e.clientY }
      if (acc > 0) live.current.onIn?.(at)
      else live.current.onOut?.(at)
      acc = 0
      cool = Date.now() + 450
    }
    const noGesture = (e: Event) => e.preventDefault() // iOS Safari's own page zoom

    document.addEventListener('touchstart', onStart, { passive: false })
    document.addEventListener('touchmove', onMove, { passive: false })
    document.addEventListener('touchend', onEnd)
    document.addEventListener('touchcancel', onEnd)
    document.addEventListener('wheel', onWheel, { passive: false })
    document.addEventListener('gesturestart', noGesture)
    return () => {
      document.removeEventListener('touchstart', onStart)
      document.removeEventListener('touchmove', onMove)
      document.removeEventListener('touchend', onEnd)
      document.removeEventListener('touchcancel', onEnd)
      document.removeEventListener('wheel', onWheel)
      document.removeEventListener('gesturestart', noGesture)
    }
  }, [target])
}
