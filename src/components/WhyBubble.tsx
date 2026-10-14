import { useEffect, useLayoutEffect, useRef, useState } from 'react'

type Props = {
  /** Text to start from (when editing an existing note). */
  initial?: string
  /** Editing an existing note offers replace / add-as-new; otherwise a single "done". */
  editing?: boolean
  onAdd: (text: string) => void
  onReplace?: (text: string) => void
  onCancel: () => void
}

// Gentle "why?" bubble under the square. Write as much as you like; Enter makes a new line.
export function WhyBubble({ initial = '', editing = false, onAdd, onReplace, onCancel }: Props) {
  const [text, setText] = useState(initial)
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
  }, [text])

  const value = text.trim()
  // Outside tap: a new note keeps what's typed; an edit is simply left as it was.
  const outside = editing ? onCancel : () => onAdd(value)

  return (
    <>
      <div className="why-catcher" onClick={outside} />
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
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="why-actions">
          {editing ? (
            <>
              <button className="why-secondary" onClick={() => onReplace?.(value)}>
                replace
              </button>
              <button className="why-done" onClick={() => onAdd(value)} disabled={!value}>
                add new note
              </button>
            </>
          ) : (
            <button className="why-done" onClick={() => onAdd(value)}>
              done
            </button>
          )}
        </div>
      </div>
      <p className="why-skip">{editing ? 'tap anywhere to leave it as it was' : 'tap anywhere to skip'}</p>
    </>
  )
}
