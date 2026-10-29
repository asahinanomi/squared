import { createContext, useContext } from 'react'
import { inProgress } from '../lib/painting'

/** The painting open right now, so its button stays lit while the sheet is up. */
export const OpenPainting = createContext<string | null>(null)

type Props = { period: string; label: string; onOpen: (period: string) => void; className?: string }

/** A month's or a year's name, as the way to its painting ("so far" while it's still going), with a small ink picture
 *  right after it: the name alone (dotted) was too quiet a cue (nomi, Oct 29, 2026). Name and picture are one button. */
export function PaintingButton({ period, label, onOpen, className }: Props) {
  const open = useContext(OpenPainting)
  return (
    <button
      className={'painting-name' + (open === period ? ' is-on' : '') + (className ? ' ' + className : '')}
      onClick={() => onOpen(period)}
      aria-label={`${label}, ${inProgress(period) ? 'so far' : 'painted'}`}
    >
      <span className="painting-label">{label}</span>
      <svg className="painting-icon" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
        <path d="M7 15.5 10.5 11.5 13 14l2-2 2 3.5" />
      </svg>
    </button>
  )
}
