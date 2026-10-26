import { createContext, useContext } from 'react'
import type { Days } from '../lib/days'
import { inProgress } from '../lib/painting'
import { PaintingThumb } from './PaintingThumb'

/** The painting open right now, so its button stays lit while the sheet is up. */
export const OpenPainting = createContext<string | null>(null)

type Props = { period: string; label: string; days: Days; onOpen: (period: string) => void }

/** The month's or year's own painting, tiny, in its frame: it opens it ("so far" while it's still going). The
 *  painting itself says what it is, where a generic picture icon didn't. */
export function PaintingButton({ period, label, days, onOpen }: Props) {
  const open = useContext(OpenPainting)
  return (
    <button
      className={'month-paint' + (open === period ? ' is-on' : '')}
      onClick={() => onOpen(period)}
      aria-label={`${label}, ${inProgress(period) ? 'so far' : 'painted'}`}
    >
      <PaintingThumb month={period} days={days} className="month-paint-thumb" />
    </button>
  )
}
