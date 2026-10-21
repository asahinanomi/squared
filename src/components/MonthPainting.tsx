import { useState } from 'react'
import type { Days } from '../lib/days'
import { save } from '../lib/exportData'
import { CANVAS, cells, counts, monthName, paintingImage, shortMonth } from '../lib/painting'
import { Sheet } from './Sheet'

type Props = {
  /** The finished month, "YYYY-MM". */
  month: string | null
  /** Shown by the new month's arrival (with its line), rather than opened from the month view. */
  arrived?: boolean
  days: Days
  /** The signature: the painter's first name. */
  name: string
  onClose: () => void
}

// A new month: the last one, shown once as a finished painting. Its squares dab in one by one on squared's canvas,
// signed. Any finished month opens it again from the month view. "keep this painting" saves it as a picture (on a phone, the share sheet: Save to Photos, or send it).
export function MonthPainting({ month, days, name, onClose, arrived }: Props) {
  const [busy, setBusy] = useState(false)
  if (!month) return null
  const keep = async () => {
    setBusy(true)
    try {
      const blob = await paintingImage(month, days, name)
      const file = new File([blob], `squared-${month}.png`, { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file] }).catch(() => undefined)
      else save(blob, file.name)
    } finally {
      setBusy(false)
    }
  }
  return (
    <Sheet open onClose={onClose}>
      <div className="painting">
        {arrived && <p className="painting-kicker">a new month. here's the last one —</p>}
        <p className="painting-title">{monthName(month)}, painted</p>
        <div className="painting-art">
          <div className="painting-face" style={{ background: CANVAS }}>
            {cells(month, days).map((cell, i) => (
              <i
                key={i}
                className={
                  cell === null ? 'is-none' : cell === 'blank' ? 'is-blank' : cell.framed ? 'is-framed' : undefined
                }
                style={{
                  background: cell && cell !== 'blank' ? cell.fill : undefined,
                  animationDelay: `${0.4 + i * 0.04}s`,
                }}
              />
            ))}
          </div>
          <span className="painting-sign">{[name, shortMonth(month)].filter(Boolean).join(' · ')}</span>
        </div>
        <p className="painting-counts">
          {counts(month, days).map((p) => (
            <span key={p.id}>
              <i style={{ background: p.hex }} />
              {p.n} {p.id === 'green' ? 'mattered' : p.id === 'red' ? 'empty' : 'slipped'}
            </span>
          ))}
        </p>
        <button className="pill painting-keep" onClick={keep} disabled={busy}>
          keep this painting
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
        <button className="painting-close" onClick={onClose}>
          close
        </button>
      </div>
    </Sheet>
  )
}
