import { useRef, useState, type ReactNode } from 'react'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDelete: () => void
  children: ReactNode
}

const REVEAL = 96 // width of the delete button behind the row
const SLOP = 8 // movement before we decide between a swipe and a scroll

// Swipe left to reveal "delete" (like Mail or Notes). Up/down still scrolls the page;
// a plain tap still reaches the row's own button.
export function SwipeRow({ open, onOpenChange, onDelete, children }: Props) {
  const start = useRef<{ x: number; y: number; base: number } | null>(null)
  const axis = useRef<'x' | 'y' | null>(null)
  const swiped = useRef(false)
  const [drag, setDrag] = useState<number | null>(null)

  const offset = drag ?? (open ? -REVEAL : 0)

  const down = (e: React.PointerEvent) => {
    start.current = { x: e.clientX, y: e.clientY, base: open ? -REVEAL : 0 }
    axis.current = null
    swiped.current = false
  }

  const move = (e: React.PointerEvent) => {
    const s = start.current
    if (!s) return
    const dx = e.clientX - s.x
    const dy = e.clientY - s.y
    if (!axis.current) {
      if (Math.abs(dx) < SLOP && Math.abs(dy) < SLOP) return
      axis.current = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
      if (axis.current === 'x') e.currentTarget.setPointerCapture(e.pointerId)
    }
    if (axis.current !== 'x') return
    swiped.current = true
    setDrag(Math.max(-REVEAL - 24, Math.min(0, s.base + dx)))
  }

  const up = () => {
    if (axis.current === 'x' && drag !== null) onOpenChange(drag < -REVEAL / 2)
    start.current = null
    axis.current = null
    setDrag(null)
  }

  return (
    <div className="swipe">
      <button className="swipe-delete" onClick={onDelete} tabIndex={open ? 0 : -1} aria-hidden={!open}>
        delete
      </button>
      <div
        className={'swipe-slide' + (drag !== null ? ' is-dragging' : '')}
        style={{ transform: `translateX(${offset}px)` }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onClickCapture={(e) => {
          // A swipe is not a tap; a tap on an open row just closes it.
          if (swiped.current || open) {
            e.stopPropagation()
            e.preventDefault()
            if (!swiped.current) onOpenChange(false)
          }
          swiped.current = false
        }}
      >
        {children}
      </div>
    </div>
  )
}
