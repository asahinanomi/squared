import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

type Props = {
  title: string
  body?: string
  /** A quiet line under the body (e.g. a link to export first). */
  aside?: ReactNode
  confirm: string
  onConfirm: () => void
  onCancel: () => void
  /** For what can't be undone: the word to type before the button works (e.g. "delete"). */
  typeToConfirm?: string
}

// A small "are you sure?" alert in the app's own style (not the browser's).
export function ConfirmDialog({ title, body, aside, confirm, onConfirm, onCancel, typeToConfirm }: Props) {
  const [typed, setTyped] = useState('')
  const ready = !typeToConfirm || typed.trim().toLowerCase() === typeToConfirm
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  return createPortal(
    <div className="confirm-backdrop" onClick={onCancel}>
      <div
        className="confirm"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-title" className="confirm-title">
          {title}
        </h2>
        {body && <p className="confirm-body">{body}</p>}
        {aside && <p className="confirm-aside">{aside}</p>}
        {typeToConfirm && (
          <label className="confirm-type">
            <span>type “{typeToConfirm}” to confirm</span>
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && ready && onConfirm()}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              autoFocus
            />
          </label>
        )}
        <div className="confirm-actions">
          <button className="confirm-cancel" onClick={onCancel} autoFocus={!typeToConfirm}>
            cancel
          </button>
          <button className="confirm-ok" onClick={onConfirm} disabled={!ready}>
            {confirm}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
