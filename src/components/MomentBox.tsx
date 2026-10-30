import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { PAINTS, type Paint } from '../lib/paints'

type Props = {
  /** "this moment…" while today is being lived, "add to today…" once painted, "add to this day…" on any other day. */
  placeholder: string
  onAdd: (text: string, color?: Paint) => void
}

// The day starts with a moment: one box at the top of the day and a + to keep it. It grows as you write; Enter keeps
// it too. The moments are listed at the foot of the day, newest first, so a kept moment is sent like mail: a paper
// slip lifts out of the box, shrinks along an arc into the top of the list (or toward the screen's foot, if the list
// is below it), and the card it lands on nudges as it arrives.
export function MomentBox({ placeholder, onAdd }: Props) {
  const [text, setText] = useState('')
  // The moment's own colour, optional, chosen as you write it (the dots show once there's something written).
  const [color, setColor] = useState<Paint | undefined>()
  const [slip, setSlip] = useState<{ text: string; top: number; left: number; width: number; n: number } | null>(null)
  const wrap = useRef<HTMLDivElement>(null)
  const box = useRef<HTMLTextAreaElement>(null)
  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [text])
  // The flight, once the slip is on the page and the list has its new card.
  const flying = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = flying.current
    if (!slip || !el) return
    const from = el.getBoundingClientRect()
    // The new card (pinned ones sit above it), and the row holding it, which hides the swipe's "delete" too.
    const card = document.querySelector<HTMLElement>('.notes .note-card.is-arriving')
    const row = card?.closest<HTMLElement>('.swipe') ?? card
    const to = card?.getBoundingClientRect()
    const foot = window.innerHeight - 96
    const onScreen = !!to && to.top < foot
    const x = onScreen ? to!.left + to!.width / 2 : window.innerWidth / 2
    const y = onScreen ? to!.top + to!.height / 2 : foot
    const dx = x - (from.left + from.width / 2)
    const dy = y - (from.top + from.height / 2)
    // The new card waits, unseen, for its slip to land.
    if (onScreen) row!.style.opacity = '0'
    const fly = el.animate(
      [
        { transform: 'translate(0, 0) scale(1)', opacity: 1 },
        { transform: 'translate(0, -14px) scale(1.03)', opacity: 1, offset: 0.2 },
        { transform: `translate(${dx * 0.35}px, ${dy * 0.55}px) scale(0.75)`, opacity: 1, offset: 0.65 },
        { transform: `translate(${dx}px, ${dy}px) scale(0.4)`, opacity: 0.7 },
      ],
      { duration: 1200, easing: 'cubic-bezier(0.45, 0, 0.35, 1)', fill: 'forwards' },
    )
    fly.onfinish = () => {
      setSlip(null)
      // Landed: the card it went into gives a small nod.
      if (!onScreen) return
      row!.style.opacity = ''
      card!.animate([{ transform: 'scale(1.05)' }, { transform: 'scale(1)' }], { duration: 400, easing: 'ease-out' })
    }
    return () => {
      fly.cancel()
      if (row) row.style.opacity = ''
    }
  }, [slip])
  const still = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

  const add = () => {
    const t = text.trim()
    if (!t) return box.current?.focus()
    const r = wrap.current?.getBoundingClientRect()
    if (r && !still()) setSlip({ text: t, top: r.top, left: r.left, width: r.width, n: (slip?.n ?? 0) + 1 })
    onAdd(t, color)
    setText('')
    setColor(undefined)
  }
  return (
    <>
      <div className={'moment-box' + (text.trim() ? ' has-text' : '')} ref={wrap}>
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
        {/* A moment can carry its own colour (optional): the square keeps the day's answer. Tap again to clear. */}
        {text.trim() && (
          <div className="moment-paint">
            paint it
            {PAINTS.map((p) => (
              <button
                key={p.id}
                className={'paint-dot' + (color === p.id ? ' is-on' : '')}
                style={{ background: p.hex }}
                onPointerDown={(e) => e.preventDefault()} // keep the keyboard up while choosing
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setColor(color === p.id ? undefined : p.id)}
                aria-label={color === p.id ? 'Take the colour away' : `Paint this moment ${p.id}`}
                aria-pressed={color === p.id}
              />
            ))}
          </div>
        )}
      </div>
      {slip &&
        createPortal(
          <div
            key={slip.n}
            ref={flying}
            className="moment-slip"
            style={{ top: slip.top, left: slip.left, width: slip.width }}
            aria-hidden="true"
          >
            {slip.text}
          </div>,
          document.body,
        )}
    </>
  )
}
