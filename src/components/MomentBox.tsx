import { useLayoutEffect, useRef, useState } from 'react'
import type { Paint } from '../lib/paints'
import { MomentColour } from './MomentColour'
import { flyAway } from '../lib/fly'

type Props = {
  /** "this moment…" while today is being lived, "add to today…" once painted, "add to this day…" on any other day. */
  placeholder: string
  onAdd: (text: string, color?: Paint) => void
}

// The day starts with a moment: one box, no button, as in Notes (nomi, Nov 1, 2026): leaving it, or a colour, keeps
// it; return makes a new line; the box reads as a place to write, never a second main action. It grows as you write. The moments are listed at the foot of the day, newest first, so a kept moment is sent like mail: the box
// itself lifts off the page, shrinks along an arc into the top of the list (or toward the screen's foot, if the list
// is below it), and the card it lands on nudges as it arrives.
export function MomentBox({ placeholder, onAdd }: Props) {
  const [text, setText] = useState('')
  // The colour just tapped: its bar breathes out, swelling and glowing (the other greys out), held a beat at its
  // fullest, then the moment is added (nomi, Oct 31, 2026).
  const [picked, setPicked] = useState<Paint>()
  const wrap = useRef<HTMLDivElement>(null)
  const box = useRef<HTMLTextAreaElement>(null)
  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [text])

  // Added with its colour, if one is tapped: choosing it is the last step, so it keeps the moment (nomi, Oct 31, 2026).
  const add = (color?: Paint, written = text) => {
    const t = written.trim()
    if (!t) return box.current?.focus()
    // The box itself flies (a copy of it, exactly as it looks), so nothing swaps or vanishes before the flight.
    flyAway(wrap.current)
    onAdd(t, color)
    setText('')
    // Kept: the keyboard goes down while the box lifts, so nothing covers where the moment lands (nomi, Oct 31, 2026).
    leaving.current = true
    box.current?.blur()
    leaving.current = false
  }
  // Closing the keyboard with words in the box keeps them as a moment (nomi, Oct 31, 2026: the ✓ above the iPhone's
  // keyboard only closes it, and with no + there was no other way without a colour). Not while a colour is being kept,
  // nor when squared itself puts the keyboard away, nor when the app is only being left.
  const leaving = useRef(false)
  const onBlur = () => {
    if (leaving.current || picked || document.visibilityState === 'hidden') return
    if (text.trim()) add()
  }
  return (
    <>
      <div className={'moment-box' + (text.trim() ? ' has-text' : '')} ref={wrap}>
        <textarea
          ref={box}
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          // One rule for every box, as in Notes (nomi, Nov 1, 2026): return makes a new line; leaving the box (the ✓
          // above a phone's keyboard, a tap or click anywhere else) keeps what you wrote, as does a colour.
          onBlur={onBlur}
          placeholder={placeholder}
          aria-label="a moment"
          enterKeyHint="enter"
          maxLength={10000}
        />
        {/* A moment can carry its own colour (optional), once there's something written: tapping one adds it. */}
        {text.trim() && (
          <MomentColour
            adds
            value={picked}
            onChange={(c) => {
              if (!c || picked) return
              setPicked(c)
              setTimeout(() => {
                // Then just as ✓ does: the keyboard goes first, the moment flies (nomi's recordings, Oct 31, 2026:
                // closing it at the tap moved the whole page during the breath).
                leaving.current = true
                box.current?.blur()
                leaving.current = false
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
