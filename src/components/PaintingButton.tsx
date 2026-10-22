import { createContext, useContext } from 'react'
import { inProgress } from '../lib/painting'

/** The painting open right now, so its button stays lit while the sheet is up. */
export const OpenPainting = createContext<string | null>(null)

type Props = { period: string; label: string; onOpen: (period: string) => void }

/** A small picture icon in ink that opens a month's or a year's painting ("so far" while it's still going). */
export function PaintingButton({ period, label, onOpen }: Props) {
  const open = useContext(OpenPainting)
  return (
    <button
      className={'month-paint' + (open === period ? ' is-on' : '')}
      onClick={() => onOpen(period)}
      aria-label={`${label}, ${inProgress(period) ? 'so far' : 'painted'}`}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3.5" y="4.5" width="17" height="15" rx="1.5" />
        <path d="M7 15.5 L10.5 11.5 L13 14 L15 12 L17 15.5" />
      </svg>
    </button>
  )
}
