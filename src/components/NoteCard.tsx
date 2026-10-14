import { useLayoutEffect, useRef, useState } from 'react'

type Props = { note?: string; noteAt?: string; onEdit: () => void }

/** "Oct 14 · 9:42 pm" */
function stamp(iso: string) {
  const d = new Date(iso)
  const day = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).toLowerCase()
  return `${day} · ${time}`
}

// The day's "why?" under the palette. Long notes show their first lines; tap to read all.
export function NoteCard({ note, noteAt, onEdit }: Props) {
  const text = useRef<HTMLParagraphElement>(null)
  const [open, setOpen] = useState(false)
  const [long, setLong] = useState(false)

  useLayoutEffect(() => {
    const el = text.current
    if (el && !open) setLong(el.scrollHeight > el.clientHeight + 1)
  }, [note, open])

  if (!note)
    return (
      <button className="note-add" onClick={onEdit}>
        add a note
      </button>
    )

  return (
    <div className={'note-card' + (open ? ' is-open' : '') + (long && !open ? ' is-long' : '')}>
      {noteAt && <p className="note-stamp">{stamp(noteAt)}</p>}
      <p ref={text} className="note-text" onClick={() => (long && !open ? setOpen(true) : onEdit())}>
        {note}
      </p>
      {long && !open && (
        <button className="note-more" onClick={() => setOpen(true)}>
          read all
        </button>
      )}
      {open && (
        <button className="note-more" onClick={onEdit}>
          edit
        </button>
      )}
    </div>
  )
}
