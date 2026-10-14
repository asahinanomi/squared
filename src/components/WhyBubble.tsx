import { useEffect, useLayoutEffect, useRef, useState } from 'react'

type Props = { initial?: string; onDone: (note: string) => void }

// Gentle "why?" bubble under the square. Write as much as you like; Enter makes a new line.
// "done" or tapping anywhere outside keeps what's typed (or nothing).
export function WhyBubble({ initial = '', onDone }: Props) {
  const [note, setNote] = useState(initial)
  const input = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const t = setTimeout(() => {
      const el = input.current
      if (!el) return
      el.focus({ preventScroll: true })
      el.setSelectionRange(el.value.length, el.value.length)
    }, 250)
    return () => clearTimeout(t)
  }, [])

  // Grow with the text, up to a cap (then it scrolls inside).
  useLayoutEffect(() => {
    const el = input.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [note])

  const done = () => onDone(note.trim())
  return (
    <>
      <div className="why-catcher" onClick={done} />
      <div className="why">
        <label className="why-label" htmlFor="why">
          why?
        </label>
        <textarea
          id="why"
          ref={input}
          className="why-input"
          placeholder="a line, or a page, or skip"
          maxLength={10000}
          rows={1}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <button className="why-done" onClick={done}>
          done
        </button>
      </div>
      <p className="why-skip">tap anywhere to skip</p>
    </>
  )
}
