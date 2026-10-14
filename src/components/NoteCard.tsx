import { useLayoutEffect, useRef, useState } from 'react'
import type { Note } from '../lib/notes'

/** "Oct 14 · 9:42 pm" */
function stamp(iso: string) {
  const d = new Date(iso)
  const day = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).toLowerCase()
  return `${day} · ${time}`
}

// One note with when it was written. Long notes show their first lines; tap the card to open it.
export function NoteCard({ note, onOpen }: { note: Note; onOpen: () => void }) {
  const text = useRef<HTMLParagraphElement>(null)
  const [long, setLong] = useState(false)

  useLayoutEffect(() => {
    const el = text.current
    if (el) setLong(el.scrollHeight > el.clientHeight + 1)
  }, [note.body])

  return (
    <button className={'note-card' + (long ? ' is-long' : '')} onClick={onOpen} aria-label="Open note">
      <span className="note-stamp">{stamp(note.writtenAt)}</span>
      <span ref={text} className="note-text">
        {note.body}
      </span>
    </button>
  )
}
