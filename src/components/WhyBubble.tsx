import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { Paint } from '../lib/paints'
import { MomentColour } from './MomentColour'
import { flyAway } from '../lib/fly'
import { ConfirmDialog } from './ConfirmDialog'

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
  /** A framed day's note: it asks "what do you want to remember?" instead of "because…". */
  pinned?: boolean
  /** Today, not painted yet: a moment as it happens, "this moment…". */
  now?: boolean
  /** Editing a note: pin it to the top of its day, or unpin it. */
  onPin?: () => void
  isPinned?: boolean
  /** A day just marked out of my hands: "Some days aren't yours to choose." over the box (a few words, or skip). */
  happened?: boolean
  /** Editing a note: its own colour, if painted, and painting it (the painted dot again takes it away). */
  paint?: Paint
  onPaint?: (color: Paint | null) => void
}

// Gentle "because…" bubble (you finish the sentence: "worth it, because…") under the square. Write as much as you like; Enter makes a new line.
// It closes at once; if saving fails, the app reopens it with the text and a quiet message.
export function WhyBubble({
  initial = '',
  original,
  initialError,
  editing = false,
  onSave,
  onDelete,
  onCancel,
  pinned,
  onPin,
  isPinned,
  happened,
  paint,
  onPaint,
  now,
}: Props) {
  const [text, setText] = useState(initial)
  const error = initialError
  const [confirming, setConfirming] = useState(false)
  // A colour just chosen for this moment: its bar breathes out and holds, as when a moment is added, then it's kept
  // and the bubble closes (nomi, Nov 1, 2026: it closed at once, so you couldn't see your choice land).
  const [picked, setPicked] = useState<Paint>()
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

  const kept = useRef(false)
  const bubble = useRef<HTMLDivElement>(null)
  const save = () => {
    if (kept.current) return
    if (!value) return editing ? undefined : onCancel()
    if (editing && value === (original ?? initial).trim()) return onCancel()
    kept.current = true
    flyAway(bubble.current) // sent like mail, as from the moment box
    onSave(value)
  }

  const del = () => {
    setConfirming(false)
    onDelete?.()
  }

  // One rule for every box, as in Notes (nomi, Nov 1, 2026): leaving keeps what you wrote, a new moment or an edit
  // alike: a tap outside, or closing the keyboard (the ✓ above a phone's). Not when the tap was inside the bubble (its
  // colours, delete, pin): those close the keyboard too, and are their own actions.
  const outside = () => {
    if (confirming) return
    save()
  }
  const inside = useRef(false)

  return (
    <>
      <div className="why-catcher" onClick={outside} />
      <div
        ref={bubble}
        className="why"
        // A tap inside the bubble: the keyboard may let go only as the tap ends (phones move focus on the click), so
        // the mark lasts a moment, never just until the finger lifts.
        onPointerDownCapture={() => {
          inside.current = true
          setTimeout(() => (inside.current = false), 700)
        }}
      >
        {/* Marked out of my hands: one kind line is the whole prompt (nomi, Nov 3, 2026: "what happened?" after it read
            redundant, and "never called a regret" needless: the square already says out of my hands). */}
        <label className="why-label" htmlFor="why">
          {pinned
            ? 'what do you want to remember?'
            : happened
              ? 'Some days aren’t yours to choose.'
              : now
                ? 'this moment…'
                : 'because…'}
        </label>
        <textarea
          id="why"
          ref={input}
          className="why-input"
          placeholder="a few words, or skip"
          maxLength={10000}
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          // A beat later, so a tap outside lands first and nothing is kept twice.
          onBlur={() => {
            if (inside.current) return
            setTimeout(save, 150)
          }}
        />
        {error && <p className="why-error">{error}</p>}
        {/* A moment's own colour, optional: the square holds the answer, the moments hold the mix. */}
        {editing && onPaint && (
          <MomentColour
            value={picked ?? paint}
            adds={!!picked}
            onChange={(c) => {
              if (picked) return
              if (!c) {
                save() // leaving keeps your words too
                return onPaint(null) // cleared: nothing to breathe, it's done at once
              }
              setPicked(c)
              setTimeout(() => {
                save() // leaving keeps your words too (and flies them)
                if (!kept.current) flyAway(bubble.current) // only the colour changed: it flies all the same
                onPaint(c)
              }, 1100)
            }}
          />
        )}
        {editing && (
          <div className="why-actions">
            <button className="why-delete" onClick={() => setConfirming(true)}>
              delete
            </button>
            {onPin && (
              <button
                className="why-pin"
                onClick={() => {
                  save() // leaving keeps your words too
                  onPin()
                }}
                aria-label={isPinned ? 'Unpin this moment' : 'Pin this moment to the top'}
              >
                <PinIcon off={isPinned} />
              </button>
            )}
          </div>
        )}
      </div>
      {confirming && (
        <ConfirmDialog
          title="Delete this moment?"
          body="It can't be undone."
          confirm="delete"
          onConfirm={del}
          onCancel={() => setConfirming(false)}
        />
      )}
    </>
  )
}

/** A push pin; crossed through when tapping it would unpin. Drawn like the bar's other icons. */
function PinIcon({ off }: { off?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 3.5 H15 L14 9.5 L17.5 13 H6.5 L10 9.5 Z" />
      <path d="M12 13 V20.5" />
      {off && <path d="M4 4 L20 20" />}
    </svg>
  )
}
