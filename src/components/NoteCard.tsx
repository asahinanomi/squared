import { useLayoutEffect, useRef, useState } from 'react'
import type { Note } from '../lib/notes'

/** "Oct 14 · 9:42 pm" */
function stamp(iso: string) {
  const d = new Date(iso)
  const day = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).toLowerCase()
  return `${day} · ${time}`
}

// One note, with when it was written. Long notes show their first lines; tap to read all.
export function NoteCard({ note, onEdit }: { note: Note; onEdit: () => void }) {
  const text = useRef<HTMLParagraphElement>(null)
  const [open, setOpen] = useState(false)
  const [long, setLong] = useState(false)

  useLayoutEffect(() => {
    const el = text.current
    if (el && !open) setLong(el.scrollHeight > el.clientHeight + 1)
  }, [note.body, open])

  return (
    <div className={'note-card' + (open ? ' is-open' : '') + (long && !open ? ' is-long' : '')}>
      <p className="note-stamp">{stamp(note.writtenAt)}</p>
      <p ref={text} className="note-text" onClick={() => (long && !open ? setOpen(true) : onEdit())}>
        {note.body}
      </p>
      {long && !open ? (
        <button className="note-more" onClick={() => setOpen(true)}>
          read all
        </button>
      ) : (
        <button className="note-more" onClick={onEdit}>
          edit
        </button>
      )}
    </div>
  )
}
