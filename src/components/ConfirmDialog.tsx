import { useEffect } from 'react'
import { createPortal } from 'react-dom'

type Props = {
  title: string
  body?: string
  confirm: string
  onConfirm: () => void
  onCancel: () => void
}

// A small "are you sure?" alert in the app's own style (not the browser's).
export function ConfirmDialog({ title, body, confirm, onConfirm, onCancel }: Props) {
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
        <div className="confirm-actions">
          <button className="confirm-cancel" onClick={onCancel} autoFocus>
            cancel
          </button>
          <button className="confirm-ok" onClick={onConfirm}>
            {confirm}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
