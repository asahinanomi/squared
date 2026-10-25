import { frameVars, type Paint } from '../lib/paints'
import { useState } from 'react'
import type { Note } from '../lib/notes'
import { ConfirmDialog } from './ConfirmDialog'
import { NoteCard } from './NoteCard'
import { SwipeRow } from './SwipeRow'

type Props = {
  notes: Note[]
  /** A framed day's colour: its pinned notes are "to remember" cards in that paint. */
  framed?: Paint
  onOpen: (n: Note) => void
  /** A way to add one here (the day screen adds them in its box at the top instead). */
  onAdd?: () => void
  onDelete: (n: Note) => Promise<void>
}

// Show/hide is remembered on this device (a convenience; fine if storage is unavailable). Until you choose, only the
// latest moment shows.
const KEY = 'squared.olderHidden'
const readHidden = () => {
  try {
    return localStorage.getItem(KEY) !== '0'
  } catch {
    return true
  }
}
const writeHidden = (hidden: boolean) => {
  try {
    localStorage.setItem(KEY, hidden ? '1' : '0')
  } catch {
    /* ignore */
  }
}

// A day's notes, oldest to newest. The latest always shows; older ones can be tucked away.
// Every note is a moment you captured: as it happened ("this moment…") or looking back ("because…"), each with its time.
export function NotesList({ notes, framed, onOpen, onAdd, onDelete }: Props) {
  const [hidden, setHidden] = useState(readHidden)
  // Only one row is swiped open at a time; deleting always asks first.
  const [swiped, setSwiped] = useState<string | null>(null)
  const [asking, setAsking] = useState<Note | null>(null)

  const row = (n: Note) => (
    <SwipeRow
      key={n.id}
      open={swiped === n.id}
      onOpenChange={(o) => setSwiped(o ? n.id : null)}
      onDelete={() => setAsking(n)}
    >
      <NoteCard note={n} framed={!!framed} onOpen={() => onOpen(n)} />
    </SwipeRow>
  )

  const confirmDelete = async () => {
    const n = asking
    setAsking(null)
    setSwiped(null)
    if (!n) return
    try {
      await onDelete(n)
    } catch (e) {
      console.error(e) // the note simply stays
    }
  }
  const toggle = () => {
    writeHidden(!hidden)
    setHidden(!hidden)
  }
  // Pinned notes always come first (oldest first) and always show; the rest keep their order.
  const pinned = notes.filter((n) => n.pinned)
  const rest = notes.filter((n) => !n.pinned)
  const older = rest.slice(0, -1)
  const latest = rest.at(-1)
  return (
    <div className="notes" style={framed ? frameVars(framed) : undefined}>
      {/* One control, the count in it: "show all 6 moments" while only the latest shows, "show latest only" when all
          do. Nothing to show or hide (one moment): no header. */}
      {older.length > 0 && (
        <div className="notes-head">
          <button className="notes-toggle" onClick={toggle} aria-expanded={!hidden}>
            {hidden ? `show all ${notes.length} moments` : 'show latest only'}
            {/* Down while there's more to open, up to tuck it away. */}
            <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d={hidden ? 'M6 9l6 6 6-6' : 'M6 15l6-6 6 6'}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      )}
      {pinned.map(row)}
      {!hidden && older.map(row)}
      {latest && row(latest)}
      {onAdd && (
        <button className="note-add" onClick={onAdd}>
          add a moment
        </button>
      )}
      {asking && (
        <ConfirmDialog
          title="Delete this moment?"
          body="It can't be undone."
          confirm="delete"
          onConfirm={confirmDelete}
          onCancel={() => {
            setAsking(null)
            setSwiped(null)
          }}
        />
      )}
    </div>
  )
}
