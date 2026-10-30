import { useCallback } from 'react'
import { paintedFresh, todayIso } from '../lib/dates'
import { draftNote, type Note, type Why } from '../lib/notes'
import type { Paint } from '../lib/paints'
import { save } from '../lib/save'
import { frameSound } from '../lib/sound'
import type { Account } from './useAccount'

const byTime = (a: Note, b: Note) => a.writtenAt.localeCompare(b.writtenAt)

/** What you do to a day: paint it, start it over, frame it, and its notes. Each shows at once and is saved straight
 *  to the account. */
export function useDayActions(
  date: string,
  { days, setDays, notes, setNotes }: Account,
  why: Why | null,
  setWhy: (w: Why | null) => void,
) {
  const onFilled = useCallback(
    (color: Paint) => {
      setWhy({}) // just painted: "because…"
      setDays((d) => {
        // A first paint is on time on the day or the next day (the database decides for good);
        // repaints keep the first paint's shade and date.
        return {
          ...d,
          [date]: d[date]
            ? {
                ...d[date],
                color,
                changedOn: d[date].color !== color ? todayIso() : d[date].changedOn,
              }
            : { backfilled: !paintedFresh(date), paintedOn: todayIso(), color },
        }
      })
      save({ k: 'color', date, color })
    },
    [date], // eslint-disable-line react-hooks/exhaustive-deps
  )

  // Frame (or unframe) a day you want to keep, any colour.
  const onFrame = () => {
    const day = date
    const was = !!days[day]?.framed
    setDays((d) => (d[day] ? { ...d, [day]: { ...d[day], framed: !was } } : d))
    // A little magic, and a pinned note: what do you want to remember? (skippable). Unframing keeps notes pinned.
    if (!was) {
      frameSound()
      if (!(notes[day] ?? []).some((n) => n.pinned)) setWhy({ pinned: true })
    }
    save({ k: 'framed', date: day, framed: !was })
  }

  // Start over: the square goes blank at once and leaves every count.
  const onWipe = () => {
    const day = date
    if (!days[day]) return
    setWhy(null)
    setDays((d) => {
      const next = { ...d }
      delete next[day]
      return next
    })
    save({ k: 'wipe', date: day })
  }

  const putNotes = (day: string, fn: (list: Note[]) => Note[]) =>
    setNotes((all) => ({ ...all, [day]: fn(all[day] ?? []).sort(byTime) }))
  const swap = (day: string, id: string, to: Note) => putNotes(day, (l) => l.map((n) => (n.id === id ? to : n)))

  const onSaveNote = async (note: Note | undefined, text: string, color?: Paint) => {
    setWhy(null)
    if (note) {
      swap(note.date, note.id, { ...note, body: text, writtenAt: new Date().toISOString() })
      save({ k: 'note-body', note, body: text })
    } else {
      const draft = draftNote(date, text, why?.pinned, color)
      putNotes(draft.date, (l) => [...l, draft])
      save({ k: 'note-add', note: draft })
    }
  }

  // Pin a note to the top of its day (or unpin it).
  const onPinNote = (note: Note) => {
    setWhy(null)
    const pinned = !note.pinned
    swap(note.date, note.id, { ...note, pinned: pinned || undefined })
    save({ k: 'note-pin', note, pinned })
  }

  // Paint a moment in its own colour (optional, any time), or take it away: the square keeps the day's answer.
  const onPaintNote = (note: Note, color: Paint | null) => {
    setWhy(null)
    swap(note.date, note.id, { ...note, color: color ?? undefined })
    save({ k: 'note-color', note, color })
  }

  const onDeleteNote = async (note: Note) => {
    setWhy(null)
    putNotes(note.date, (l) => l.filter((n) => n.id !== note.id))
    save({ k: 'note-del', note })
  }

  return { onFilled, onFrame, onWipe, onSaveNote, onPinNote, onPaintNote, onDeleteNote }
}
