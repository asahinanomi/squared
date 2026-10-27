import { writtenWhen } from '../lib/dates'
import type { Note } from '../lib/notes'

// One moment, in full, with when it was written. Tap it to update or delete it.
export function NoteCard({
  note,
  framed,
  onOpen,
  arriving,
}: {
  note: Note
  framed?: boolean
  onOpen: () => void
  /** Just written: it glows once as it arrives. */
  arriving?: boolean
}) {
  return (
    <button
      className={
        'note-card' +
        (note.pinned ? (framed ? ' is-pinned is-remember' : ' is-pinned') : '') +
        (arriving ? ' is-arriving' : '')
      }
      onClick={onOpen}
      aria-label="Open moment"
    >
      {/* Pinned: on a framed day it's "to remember", in the day's green; any other day, a quiet "pinned". */}
      {note.pinned && <span className="note-pin">{framed ? 'to remember' : 'pinned'}</span>}
      <span className="note-stamp">{writtenWhen(note.writtenAt, note.date)}</span>
      <span className="note-text">{note.body}</span>
    </button>
  )
}
