import { useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

type Props = {
  /** "this moment…" while today is being lived, "add to today…" once painted, "add to this day…" on any other day. */
  placeholder: string
  onAdd: (text: string) => void
}

// The day starts with a moment: one box at the top of the day and a + to keep it. It grows as you write; Enter keeps
// it too. The moments are listed at the foot of the day, newest first, so a kept moment lifts out of the box as a
// paper slip and drifts down toward them (the new one glows once when it arrives there).
export function MomentBox({ placeholder, onAdd }: Props) {
  const [text, setText] = useState('')
  const [slip, setSlip] = useState<{ text: string; top: number; left: number; width: number; n: number } | null>(null)
  const wrap = useRef<HTMLDivElement>(null)
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
    const r = wrap.current?.getBoundingClientRect()
    if (r) setSlip({ text: t, top: r.top, left: r.left, width: r.width, n: (slip?.n ?? 0) + 1 })
    onAdd(t)
    setText('')
  }
  return (
    <>
      <div className="moment-box" ref={wrap}>
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
      {slip &&
        createPortal(
          <div
            key={slip.n}
            className="moment-slip"
            style={{ top: slip.top, left: slip.left, width: slip.width }}
            onAnimationEnd={() => setSlip(null)}
            aria-hidden="true"
          >
            {slip.text}
          </div>,
          document.body,
        )}
    </>
  )
}
