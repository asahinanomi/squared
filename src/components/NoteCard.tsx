import type { Note } from '../lib/notes'

/** "Wed, Oct 14, 2026 · 4:52 pm" */
function stamp(iso: string) {
  const d = new Date(iso)
  const day = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).toLowerCase()
  return `${day} · ${time}`
}

// One note, in full, with when it was written. Tap it to update or delete it.
export function NoteCard({ note, framed, onOpen }: { note: Note; framed?: boolean; onOpen: () => void }) {
  return (
    <button
      className={'note-card' + (note.pinned ? (framed ? ' is-pinned is-remember' : ' is-pinned') : '')}
      onClick={onOpen}
      aria-label="Open note"
    >
      {/* Pinned: on a framed day it's "to remember", in the day's green; any other day, a quiet "pinned". */}
      {note.pinned && <span className="note-pin">{framed ? 'to remember' : 'pinned'}</span>}
      <span className="note-stamp">{stamp(note.writtenAt)}</span>
      <span className="note-text">{note.body}</span>
    </button>
  )
}
