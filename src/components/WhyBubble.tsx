import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ConfirmDialog } from './ConfirmDialog'
import { Glass } from './LifeGlass'

type Props = {
  /** Text to start with: the note being edited, or text whose save failed; empty for a new note. */
  initial?: string
  /** The saved text of the note being edited, to tell whether anything changed. */
  original?: string
  /** Why the last save didn't go through, if it didn't. */
  initialError?: string
  /** Editing an existing note offers update / delete; a new note offers save. */
  editing?: boolean
  /** Saves (the app shows the change at once and handles failures). */
  onSave: (text: string) => void
  onDelete?: () => void
  onCancel: () => void
  /** Just painted: "your 3rd mattered day this month", with a tiny hourglass whose grains fall for a new square. */
  reveal?: { text: string; fresh: boolean }
}

// Gentle "why?" bubble under the square. Write as much as you like; Enter makes a new line.
// It closes at once; if saving fails, the app reopens it with the text and a quiet message.
export function WhyBubble({
  initial = '',
  original,
  initialError,
  editing = false,
  onSave,
  onDelete,
  onCancel,
  reveal,
}: Props) {
  const [text, setText] = useState(initial)
  const error = initialError
  const [confirming, setConfirming] = useState(false)
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

  const save = () => {
    if (!value) return editing ? undefined : onCancel()
    if (editing && value === (original ?? initial).trim()) return onCancel()
    onSave(value)
  }

  const del = () => {
    setConfirming(false)
    onDelete?.()
  }

  // Outside tap: a new note keeps what's typed; an edit is left as it was.
  const outside = () => {
    if (confirming) return
    if (editing) onCancel()
    else save()
  }

  return (
    <>
      <div className="why-catcher" onClick={outside} />
      <div className="why">
        {reveal && (
          <p className="why-reveal">
            <span className={'lifeglass is-mini' + (reveal.fresh ? ' is-falling' : '')}>
              <Glass left={0.55} />
            </span>
            {reveal.text}
          </p>
        )}
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
        {error && <p className="why-error">{error}</p>}
        <div className="why-actions">
          <button className="why-done" onClick={save} disabled={editing && !value}>
            {editing ? 'update' : 'done'}
          </button>
          {editing && (
            <button className="why-delete" onClick={() => setConfirming(true)}>
              delete
            </button>
          )}
        </div>
      </div>
      {confirming && (
        <ConfirmDialog
          title="Delete this note?"
          body="It can't be undone."
          confirm="delete"
          onConfirm={del}
          onCancel={() => setConfirming(false)}
        />
      )}
      <p className="why-skip">{editing ? 'tap anywhere to leave it as it was' : 'tap anywhere to skip'}</p>
    </>
  )
}
