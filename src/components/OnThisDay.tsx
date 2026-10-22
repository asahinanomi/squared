import { monthsAgo, todayIso } from '../lib/dates'
import type { Days } from '../lib/days'
import type { Note, Notes } from '../lib/notes'
import { squareFill, WORD } from '../lib/paints'

type Props = { days: Days; notes: Notes; onDay: (iso: string) => void; className?: string }

/** On this day: a month and a year ago today (whichever were painted), each its square, word and note in one
 *  compact line (up to two). A tap opens that day. On home, and under today's square. */
export function OnThisDay({ days, notes, onDay, className = '' }: Props) {
  const today = todayIso()
  const first = (iso: string): Note | undefined => (notes[iso] ?? []).find((n) => n.pinned) ?? notes[iso]?.at(-1)
  const rows = (
    [
      [1, 'a month ago today'],
      [12, 'a year ago today'],
    ] as const
  )
    .map(([n, label]) => ({ iso: monthsAgo(today, n), label }))
    .filter((a): a is { iso: string; label: (typeof a)['label'] } => !!a.iso && !!days[a.iso])
  if (!rows.length) return null
  return (
    <section className={'home-card home-ago ' + className}>
      {rows.map((a) => {
        const d = days[a.iso]
        const note = first(a.iso)
        return (
          <button key={a.iso} onClick={() => onDay(a.iso)}>
            <span className="home-dot" style={{ background: squareFill(d.color, d.framed) }} aria-hidden="true" />
            <span>
              <b>{a.label}</b>: {WORD[d.color]}
              {note && <>. “{note.body}”</>}
            </span>
          </button>
        )
      })}
    </section>
  )
}
