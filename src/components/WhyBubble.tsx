import { useEffect, useRef, useState } from 'react'

type Props = { initial?: string; onDone: (note: string) => void }

// Gentle "why?" bubble under the square. Tapping anywhere outside keeps what's typed (or nothing).
export function WhyBubble({ initial = '', onDone }: Props) {
  const [note, setNote] = useState(initial)
  const input = useRef<HTMLInputElement>(null)
  useEffect(() => {
    const t = setTimeout(() => input.current?.focus({ preventScroll: true }), 250)
    return () => clearTimeout(t)
  }, [])
  const done = () => onDone(note.trim())
  return (
    <>
      <div className="why-catcher" onClick={done} />
      <div className="why">
        <label className="why-label" htmlFor="why">
          why?
        </label>
        <input
          id="why"
          ref={input}
          className="why-input"
          placeholder="one line, or skip"
          maxLength={140}
          autoComplete="off"
          enterKeyHint="done"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && done()}
        />
      </div>
      <p className="why-skip">tap anywhere to skip</p>
    </>
  )
}
