import { useEffect, useState, type ReactNode } from 'react'

type Props = { open: boolean; onClose: () => void; children: ReactNode }

export function Sheet({ open, onClose, children }: Props) {
  // Keep mounted through the slide-down so it animates out.
  const [mounted, setMounted] = useState(open)
  useEffect(() => {
    if (open) setMounted(true)
  }, [open])
  if (!mounted) return null
  return (
    <div
      className={'sheet-backdrop' + (open ? ' is-open' : '')}
      onClick={onClose}
      onTransitionEnd={() => !open && setMounted(false)}
    >
      <div className="sheet" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        {children}
      </div>
    </div>
  )
}
