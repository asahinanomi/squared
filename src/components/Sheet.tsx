import { useEffect, useRef, useState, type ReactNode } from 'react'

type Props = { open: boolean; onClose: () => void; children: ReactNode; className?: string }

export function Sheet({ open, onClose, children, className }: Props) {
  // Keep mounted through the slide-down so it animates out.
  const [mounted, setMounted] = useState(open)
  useEffect(() => {
    if (open) setMounted(true)
  }, [open])
  // A swipe down closes it too (unless it starts in a list that's scrolled down).
  const start = useRef<number | null>(null)
  if (!mounted) return null
  return (
    <div
      className={'sheet-backdrop' + (open ? ' is-open' : '')}
      onClick={onClose}
      onTransitionEnd={() => !open && setMounted(false)}
    >
      <div
        className={'sheet' + (className ? ' ' + className : '')}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => {
          const scrolled = (e.target as HTMLElement).closest('ul')?.scrollTop
          start.current = scrolled ? null : e.touches[0].clientY
        }}
        onTouchEnd={(e) => {
          if (start.current !== null && e.changedTouches[0].clientY - start.current > 60) onClose()
          start.current = null
        }}
      >
        <div className="sheet-handle" />
        {children}
      </div>
    </div>
  )
}
