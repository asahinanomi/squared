import { useEffect, useRef, useState } from 'react'
import type { Days } from '../lib/days'
import { save } from '../lib/exportData'
import { drawPainting, inProgress, monthName, paintingImage } from '../lib/painting'
import { Sheet } from './Sheet'

type Props = {
  /** The month, "YYYY-MM": a finished one, or this one so far. */
  month: string | null
  /** Shown by the new month's arrival (with its line), rather than opened from the month view. */
  arrived?: boolean
  days: Days
  /** The signature: the painter's first name. */
  name: string
  onClose: () => void
  /** Kept: it hangs in my paintings. */
  onKeep?: (month: string) => void
  /** Already kept: the button only downloads it again. */
  kept?: boolean
}

// A new month: the last one, shown once as a finished painting (see lib/painting), framed and signed. Any finished
// month opens it again from its picture icon; kept ones hang in my paintings (settings); this month shows "so far", unsigned. No counts: it's a painting, not a score. "keep this painting" saves it as a picture (on a phone, the share sheet: Save to Photos, or send it).
export function MonthPainting({ month, days, name, onClose, arrived, onKeep, kept }: Props) {
  const [busy, setBusy] = useState(false)
  const art = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = art.current
    if (!month || !c) return
    drawPainting(c, month, days, name, Math.round(c.clientWidth * (window.devicePixelRatio || 1)))
  }, [month, days, name])
  if (!month) return null
  const title = `${monthName(month)}, ${inProgress(month) ? 'so far' : 'painted'}`
  const keep = async () => {
    setBusy(true)
    if (!kept) onKeep?.(month)
    try {
      const blob = await paintingImage(month, days, name)
      const file = new File([blob], `squared-${month}.png`, { type: 'image/png' })
      // On a phone, the share sheet (Save to Photos, or send it); on a computer, straight to downloads.
      const phone = matchMedia('(pointer: coarse)').matches
      if (phone && navigator.canShare?.({ files: [file] }))
        await navigator.share({ files: [file] }).catch(() => undefined)
      else save(blob, file.name)
    } finally {
      setBusy(false)
    }
  }
  return (
    <Sheet open onClose={onClose}>
      <div className="painting">
        {arrived && (
          <p className="painting-kicker">a new {month.length === 4 ? 'year' : 'month'}. here's the last one —</p>
        )}
        <p className="painting-title">{title}</p>
        <canvas ref={art} className="painting-art" role="img" aria-label={title} />
        {inProgress(month) ? (
          <p className="painting-later">Yours to keep once {month.length === 4 ? 'the year' : 'the month'} ends.</p>
        ) : (
          <button className="pill painting-keep" onClick={keep} disabled={busy}>
            {kept ? 'download' : 'keep this painting'}
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 4 V15 M7 10.5 L12 15.5 L17 10.5 M5 19.5 H19" />
            </svg>
          </button>
        )}
        <button className="painting-close" onClick={onClose}>
          close
        </button>
      </div>
    </Sheet>
  )
}
