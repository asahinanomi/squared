import { useState } from 'react'
import type { Note } from '../lib/notes'
import { NoteCard } from './NoteCard'

type Props = { notes: Note[]; onOpen: (n: Note) => void; onAdd: () => void }

// A day's notes, oldest to newest. Earlier ones stay folded so the latest feeling leads.
export function NotesList({ notes, onOpen, onAdd }: Props) {
  const [showEarlier, setShowEarlier] = useState(false)
  const earlier = notes.slice(0, -1)
  const latest = notes.at(-1)
  return (
    <div className="notes">
      {earlier.length > 0 && (
        <button className="note-earlier" onClick={() => setShowEarlier(!showEarlier)}>
          {showEarlier ? 'hide earlier notes' : `${earlier.length} earlier ${earlier.length === 1 ? 'note' : 'notes'}`}
        </button>
      )}
      {showEarlier && earlier.map((n) => <NoteCard key={n.id} note={n} onOpen={() => onOpen(n)} />)}
      {latest && <NoteCard key={latest.id} note={latest} onOpen={() => onOpen(latest)} />}
      <button className="note-add" onClick={onAdd}>
        add new note
      </button>
    </div>
  )
}
