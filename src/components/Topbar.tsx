import { useState } from 'react'
import { Logo } from './Logo'

type Props = { onHome: () => void; onCalendar: () => void; onSignOut: () => void }

export function Topbar({ onHome, onCalendar, onSignOut }: Props) {
  const [open, setOpen] = useState(false)
  const go = (fn: () => void) => () => {
    setOpen(false)
    fn()
  }
  return (
    <header className="topbar">
      <button className="logo-btn" onClick={onHome} aria-label="Today">
        <Logo />
      </button>
      <button className={'menu-btn' + (open ? ' is-open' : '')} aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span />
        <span />
      </button>
      {open && (
        <div className="menu-layer" onClick={() => setOpen(false)}>
          <nav className="menu" onClick={(e) => e.stopPropagation()}>
            <button onClick={go(onCalendar)}>calendar</button>
            <button onClick={go(onSignOut)}>sign out</button>
          </nav>
        </div>
      )}
    </header>
  )
}
