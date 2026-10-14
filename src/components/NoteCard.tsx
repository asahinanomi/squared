type Props = { note?: string; noteAt?: string; onEdit: () => void }

function stamp(iso: string) {
  const d = new Date(iso)
  const day = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).toLowerCase()
  return `written ${day} · ${time}`
}

// The day's "why?", readable under the square. Tap to rewrite it.
export function NoteCard({ note, noteAt, onEdit }: Props) {
  if (!note)
    return (
      <button className="note-add" onClick={onEdit}>
        add a note
      </button>
    )
  return (
    <button className="note-card" onClick={onEdit} aria-label="Edit note">
      {noteAt && <span className="note-stamp">{stamp(noteAt)}</span>}
      <span className="note-text">{note}</span>
    </button>
  )
}
