import { useEffect, useLayoutEffect, useRef, useState } from 'react'

type Props = {
  /** Text of the note being edited; empty for a new note. */
  initial?: string
  /** Editing an existing note offers update / delete; a new note offers save. */
  editing?: boolean
  /** Resolves once saved; rejects with a readable message if it couldn't be. */
  onSave: (text: string) => Promise<void>
  onDelete?: () => Promise<void>
  onCancel: () => void
}

// Gentle "why?" bubble under the square. Write as much as you like; Enter makes a new line.
// It only closes once the note is safely saved; on failure the text stays here.
export function WhyBubble({ initial = '', editing = false, onSave, onDelete, onCancel }: Props) {
  const [text, setText] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
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

  const run = async (action: () => Promise<void>) => {
    setBusy(true)
    setError(null)
    try {
      await action()
    } catch (e) {
      setError(e instanceof Error ? e.message : "couldn't save, try again")
      setBusy(false)
    }
  }

  const save = () => {
    if (!value) return editing ? undefined : onCancel()
    if (editing && value === initial.trim()) return onCancel()
    run(() => onSave(value))
  }

  const del = () => {
    if (!confirmDelete) return setConfirmDelete(true)
    if (onDelete) run(onDelete)
  }

  // Outside tap: a new note keeps what's typed; an edit is left as it was.
  const outside = () => {
    if (busy) return
    if (editing) onCancel()
    else save()
  }

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
          onChange={(e) => {
            setText(e.target.value)
            setConfirmDelete(false)
          }}
        />
        {error && <p className="why-error">{error}</p>}
        <div className="why-actions">
          {editing && (
            <button className={'why-delete' + (confirmDelete ? ' is-confirming' : '')} onClick={del} disabled={busy}>
              {confirmDelete ? 'tap again to delete' : 'delete this note'}
            </button>
          )}
          <button className="why-done" onClick={save} disabled={busy || (editing && !value)}>
            {busy ? 'saving…' : editing ? 'update' : 'save'}
          </button>
        </div>
      </div>
      <p className="why-skip">{editing ? 'tap anywhere to leave it as it was' : 'tap anywhere to skip'}</p>
    </>
  )
}
