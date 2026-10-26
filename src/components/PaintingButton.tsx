import { createContext, useContext } from 'react'
import { inProgress } from '../lib/painting'

/** The painting open right now, so its button stays lit while the sheet is up. */
export const OpenPainting = createContext<string | null>(null)

type Props = { period: string; label: string; onOpen: (period: string) => void; className?: string }

/** A month's or a year's name, as the way to its painting ("so far" while it's still going): the dotted underline
 *  that says "tap for more" everywhere in squared, as on "meaningfully". No icon: the name itself is the door. */
export function PaintingButton({ period, label, onOpen, className }: Props) {
  const open = useContext(OpenPainting)
  return (
    <button
      className={'painting-name' + (open === period ? ' is-on' : '') + (className ? ' ' + className : '')}
      onClick={() => onOpen(period)}
      aria-label={`${label}, ${inProgress(period) ? 'so far' : 'painted'}`}
    >
      {label}
    </button>
  )
}
