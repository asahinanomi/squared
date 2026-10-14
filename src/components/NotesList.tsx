import { useState } from 'react'
import type { Note } from '../lib/notes'
import { NoteCard } from './NoteCard'

type Props = { notes: Note[]; onOpen: (n: Note) => void; onAdd: () => void }

// Show/hide is remembered on this device (a convenience; fine if storage is unavailable).
const KEY = 'squared.olderHidden'
const readHidden = () => {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
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
export function NotesList({ notes, onOpen, onAdd }: Props) {
  const [hidden, setHidden] = useState(readHidden)
  const toggle = () => {
    writeHidden(!hidden)
    setHidden(!hidden)
  }
  const older = notes.slice(0, -1)
  const latest = notes.at(-1)
  return (
    <div className="notes">
      {notes.length > 0 && (
        <div className="notes-head">
          <span className="notes-count">{`${notes.length} ${notes.length === 1 ? 'note' : 'notes'}`}</span>
          {older.length > 0 && (
            <button className="notes-toggle" onClick={toggle} aria-expanded={!hidden}>
              {hidden ? `show ${older.length} older` : 'hide older'}
              <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d={hidden ? 'M6 9l6 6 6-6' : 'M6 15l6-6 6 6'}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </button>
          )}
        </div>
      )}
      {!hidden && older.map((n) => <NoteCard key={n.id} note={n} onOpen={() => onOpen(n)} />)}
      {latest && <NoteCard key={latest.id} note={latest} onOpen={() => onOpen(latest)} />}
      <button className="note-add" onClick={onAdd}>
        add new note
      </button>
    </div>
  )
}
