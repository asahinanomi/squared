import { useLayoutEffect, useRef, useState } from 'react'

type Props = { note?: string; onEdit: () => void }

// The day's "why?" under the palette. Long notes show their first lines; tap to read all.
export function NoteCard({ note, onEdit }: Props) {
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
