import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { markDone } from '../lib/onceADay'
import { useLeaving } from '../lib/useLeaving'
import { useOneHint } from '../lib/oneHint'
import { inProgress } from '../lib/painting'

/** The painting open right now, so its button stays lit while the sheet is up. */
export const OpenPainting = createContext<string | null>(null)
/**
 * The month whose picture carries the painting hint (nomi, Nov 5, 2026): the latest finished month with days, from the
 * first downloadable painting until a painting has been opened from its picture (or downloaded) once. Null: no hint.
 */
export const PaintingHint = createContext<string | null>(null)
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

type Props = {
  period: string
  label: string
  onOpen: (period: string) => void
  className?: string
  /** Never carries the painting hint: a view's big title (the hint teaches the small month names in the body, the
   *  pattern met everywhere; one bubble at a time: nomi, Nov 5, 2026). */
  noHint?: boolean
}

/** A month's or a year's name, as the way to its painting ("so far" while it's still going), with a small ink picture
 *  right after it: the name alone (dotted) was too quiet a cue (nomi, Oct 29, 2026). Name and picture are one button. */
export function PaintingButton({ period, label, onOpen, className, noHint }: Props) {
  const open = useContext(OpenPainting)
  // The painting hint, on this picture if it's the one: "your October, as a painting ↑", each visit, until used; it goes
  // at a touch elsewhere or after 10 seconds, fading.
  const hinted = useContext(PaintingHint) === period && !noHint
  // It comes when this name is actually on screen (a view may build many months up front), and again each time it
  // comes back into view, until used.
  const [hint, setHint] = useState(false)
  const self = useRef<HTMLButtonElement>(null)
  const [seen, setSeen] = useState(0) // counts each time it comes into view
  useEffect(() => {
    const el = self.current
    if (!hinted || !el) return
    let inView = false
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !inView) setSeen((n) => n + 1)
        inView = e.isIntersecting
      },
      { threshold: 1 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [hinted])
  useEffect(() => {
    if (!hinted || !seen) return
    setHint(true)
    const t = setTimeout(() => setHint(false), 10000)
    const away = (e: PointerEvent) => !(e.target as Element | null)?.closest?.('.painting-hint') && setHint(false)
    const arm = setTimeout(() => document.addEventListener('pointerdown', away), 400)
    return () => {
      clearTimeout(t)
      clearTimeout(arm)
      document.removeEventListener('pointerdown', away)
    }
  }, [hinted, seen])
  const bubble = useLeaving(useOneHint(`painting-${period}`, hint && hinted))
  return (
    <button
      ref={self}
      className={'painting-name' + (open === period ? ' is-on' : '') + (className ? ' ' + className : '')}
      onClick={() => {
        markDone('paintingOpened')
        setHint(false)
        onOpen(period)
      }}
      aria-label={`${label}, ${inProgress(period) ? 'so far' : 'painted'}`}
    >
      <span className="painting-label">{label}</span>
      <svg className="painting-icon" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
        <path d="M7 15.5 10.5 11.5 13 14l2-2 2 3.5" />
      </svg>
      {bubble.shown && (
        <span className={'painting-hint' + (bubble.leaving ? ' is-leaving' : '')}>
          your {MONTHS[Number(period.slice(5, 7)) - 1]}, as a painting ↑
        </span>
      )}
    </button>
  )
}
