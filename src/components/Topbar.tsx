import { useState } from 'react'
import { Logo } from './Logo'

type Props = {
  onHome: () => void
  /** The menu's "today": always the day, painted or not. */
  onToday: () => void
  onCalendar: () => void
  onIdea: () => void
  onSettings: () => void
}

export function Topbar({ onHome, onToday, onCalendar, onIdea, onSettings }: Props) {
  const [open, setOpen] = useState(false)
  const go = (fn: () => void) => () => {
    setOpen(false)
    fn()
  }
  return (
    <header className="topbar">
      {/* Every screen's top left: the logo, home. (Zooming out is the bar's job.) */}
      <button className="logo-btn" onClick={onHome} aria-label="Home">
        <Logo />
      </button>
      <button
        className={'menu-btn' + (open ? ' is-open' : '')}
        aria-label="Menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <span />
        <span />
      </button>
      {open && (
        <div className="menu-layer" onClick={() => setOpen(false)}>
          <nav className="menu" onClick={(e) => e.stopPropagation()}>
            <button onClick={go(onToday)}>today</button>
            <button onClick={go(onCalendar)}>my days</button>
            <button onClick={go(onSettings)}>settings</button>
            {/* About the app, not about you: set apart at the foot, quieter. Its page holds the rest (get in touch, support, the small print). */}
            <button className="menu-idea" onClick={go(onIdea)}>
              the idea
            </button>
          </nav>
        </div>
      )}
    </header>
  )
}
