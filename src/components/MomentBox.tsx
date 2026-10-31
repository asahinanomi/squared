import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { Paint } from '../lib/paints'
import { MomentColour } from './MomentColour'

type Props = {
  /** "this moment…" while today is being lived, "add to today…" once painted, "add to this day…" on any other day. */
  placeholder: string
  onAdd: (text: string, color?: Paint) => void
}

// The day starts with a moment: one box at the top of the day and a + to keep it. It grows as you write; Enter keeps
// it too. The moments are listed at the foot of the day, newest first, so a kept moment is sent like mail: the box
// itself lifts off the page, shrinks along an arc into the top of the list (or toward the screen's foot, if the list
// is below it), and the card it lands on nudges as it arrives.
export function MomentBox({ placeholder, onAdd }: Props) {
  const [text, setText] = useState('')
  // The colour just tapped: its bar breathes out, swelling and glowing (the other greys out), held a beat at its
  // fullest, then the moment is added (nomi, Oct 31, 2026).
  const [picked, setPicked] = useState<Paint>()
  // The box itself flies (a copy of it, exactly as it looks), so nothing swaps or vanishes before the flight.
  const [slip, setSlip] = useState<{ ghost: HTMLElement; shadow: string } | null>(null)
  const wrap = useRef<HTMLDivElement>(null)
  const box = useRef<HTMLTextAreaElement>(null)
  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [text])
  // The flight: the box lifts off the page, its shadow growing, then shrinks along an arc into the list.
  useEffect(() => {
    if (!slip) return
    const el = slip.ghost
    document.body.appendChild(el)
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
    const lifted = 'inset 0 0 0 1.5px #e2e2db, 0 10px 26px rgba(20, 20, 19, 0.16)'
    const fly = el.animate(
      [
        { transform: 'translate(0, 0) scale(1)', opacity: 1, boxShadow: slip.shadow },
        { transform: 'translate(0, -14px) scale(1.03)', opacity: 1, boxShadow: lifted, offset: 0.25 },
        { transform: `translate(${dx * 0.35}px, ${dy * 0.55}px) scale(0.75)`, opacity: 1, offset: 0.65 },
        { transform: `translate(${dx}px, ${dy}px) scale(0.4)`, opacity: 0.7 },
      ],
      { duration: 1400, easing: 'cubic-bezier(0.45, 0, 0.35, 1)', fill: 'forwards' },
    )
    fly.onfinish = () => {
      el.remove()
      setSlip(null)
      // Landed: the card it went into gives a small nod.
      if (!onScreen) return
      row!.style.opacity = ''
      card!.animate([{ transform: 'scale(1.05)' }, { transform: 'scale(1)' }], { duration: 400, easing: 'ease-out' })
    }
    return () => {
      fly.cancel()
      el.remove()
      if (row) row.style.opacity = ''
    }
  }, [slip])
  const still = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

  // Added with its colour, if one is tapped: choosing it is the last step, so it keeps the moment (nomi, Oct 31, 2026).
  const add = (color?: Paint) => {
    const t = text.trim()
    if (!t) return box.current?.focus()
    const w = wrap.current
    if (w && !still()) {
      const r = w.getBoundingClientRect()
      const ghost = w.cloneNode(true) as HTMLElement
      ghost.querySelector('textarea')!.value = text
      ghost.classList.add('is-flying')
      ghost.setAttribute('aria-hidden', 'true')
      Object.assign(ghost.style, {
        top: `${r.top}px`,
        left: `${r.left}px`,
        width: `${r.width}px`,
        height: `${r.height}px`,
      })
      // Its outline as it was (darker while you were writing), plus a shadow not yet cast.
      setSlip({ ghost, shadow: `${getComputedStyle(w).boxShadow}, rgba(20, 20, 19, 0) 0px 0px 0px 0px` })
    }
    onAdd(t, color)
    setText('')
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
        <button className="moment-add" onClick={() => add()} aria-label="Add this moment">
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
        {/* A moment can carry its own colour (optional), once there's something written: tapping one adds it. */}
        {text.trim() && (
          <MomentColour
            adds
            value={picked}
            onChange={(c) => {
              if (!c || picked) return
              setPicked(c)
              setTimeout(() => {
                add(c)
                setPicked(undefined)
              }, 1100)
            }}
          />
        )}
      </div>
    </>
  )
}
