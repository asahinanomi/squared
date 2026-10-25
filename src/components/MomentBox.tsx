import { useLayoutEffect, useRef, useState } from 'react'
import type { Note } from '../lib/notes'

type Props = {
  /** "this moment…" while today is being lived; "because…" once the day is painted. */
  placeholder: string
  /** The day's moments, for the quiet line under the box: when the last one was added. */
  notes: Note[]
  onAdd: (text: string) => void
}

const time = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).toLowerCase()

/** "3:30 pm" if it was written today, else "Oct 26 · 3:30 pm" (a moment can be added to a day later). */
function when(iso: string) {
  const d = new Date(iso)
  if (d.toDateString() === new Date().toDateString()) return time(d)
  return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · ${time(d)}`
}

// The day starts with a moment: one box at the top of the day, "this moment…", and a + to keep it. It grows as you
// write; Enter keeps it too. The moments themselves are listed at the foot of the day, so a quiet line under the box
// says the last one landed, and when.
export function MomentBox({ placeholder, notes, onAdd }: Props) {
  const [text, setText] = useState('')
  const box = useRef<HTMLTextAreaElement>(null)
  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [text])
  const add = () => {
    const t = text.trim()
    if (!t) return box.current?.focus()
    onAdd(t)
    setText('')
  }
  const last = notes.reduce<string | null>((at, n) => (!at || n.writtenAt > at ? n.writtenAt : at), null)
  return (
    <>
      <div className="moment-box">
        <textarea
          ref={box}
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault()
              add()
            }
          }}
          placeholder={placeholder}
          aria-label="a moment"
          enterKeyHint="done"
          maxLength={10000}
        />
        <button className="moment-add" onClick={add} aria-label="Add this moment">
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      {last && (
        <p className="moment-last" role="status">
          last moment added {when(last)}
        </p>
      )}
    </>
  )
}
