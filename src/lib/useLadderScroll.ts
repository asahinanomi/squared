import { useCallback, useLayoutEffect, useRef, useState } from 'react'

type Options = {
  /** How far back the list may go (in items before the newest), or Infinity. */
  maxBack: number
  /** Items added at a time as you scroll back. */
  batch: number
  /** The item to open centred on, and how many items back from the newest it is. */
  focus: string
  focusBack: number
}

/**
 * A vertical list of periods (months, years…) ending at the current one, built backwards as you
 * scroll up. Each item is an element with a `data-key`. Opens centred on `focus`, keeps your place
 * when older items are added above, and reports which item crosses the middle of the screen.
 */
export function useLadderScroll({ maxBack, batch, focus, focusBack }: Options) {
  const [back, setBack] = useState(() => Math.min(Math.max(batch, focusBack + 2), maxBack))
  const [visible, setVisible] = useState(focus)
  const scroller = useRef<HTMLDivElement>(null)
  const heightBefore = useRef<number | null>(null)

  const item = (key: string) => scroller.current?.querySelector<HTMLElement>(`[data-key="${key}"]`)
  const centre = (key: string) => {
    const el = scroller.current
    const it = item(key)
    if (el && it) el.scrollTop = it.offsetTop - (el.clientHeight - it.offsetHeight) / 2
  }

  // Open centred on the focus — only on arrival: the app never remembers where you scrolled.
  useLayoutEffect(() => centre(focus), [])

  // After adding older items above, keep what you're looking at in place.
  useLayoutEffect(() => {
    const el = scroller.current
    if (el && heightBefore.current !== null) {
      el.scrollTop += el.scrollHeight - heightBefore.current
      heightBefore.current = null
    }
  }, [back])

  const grow = (to: number) => {
    if (to <= back || back >= maxBack) return
    heightBefore.current = scroller.current?.scrollHeight ?? null
    setBack(Math.min(to, maxBack))
  }

  const onScroll = useCallback(() => {
    const el = scroller.current
    if (!el) return
    if (el.scrollTop < el.clientHeight && heightBefore.current === null) grow(back + batch)
    const mid = el.scrollTop + el.clientHeight / 2
    for (const it of el.querySelectorAll<HTMLElement>('[data-key]')) {
      if (it.offsetTop <= mid && it.offsetTop + it.offsetHeight > mid) {
        setVisible(it.dataset.key!)
        break
      }
    }
  }, [back, batch, maxBack])

  /** Jump straight to an item (`stepsBack` from the newest), building older items if needed. */
  const jumpTo = (key: string, stepsBack: number) => {
    if (stepsBack >= back) grow(stepsBack + batch)
    setVisible(key)
    // A straight jump (a smooth glide would fight items being added above).
    requestAnimationFrame(() => centre(key))
  }

  return { scroller, back, visible, onScroll, jumpTo }
}
