import { useState } from 'react'
import { Logo } from './Logo'

type Props = {
  onHome: () => void
  /** The menu's "today": always the day, painted or not. */
  onToday: () => void
  onCalendar: () => void
  onIdea: () => void
  onSettings: () => void
  onSignOut: () => void
}

export function Topbar({ onHome, onToday, onCalendar, onIdea, onSettings, onSignOut }: Props) {
  const [open, setOpen] = useState(false)
  const go = (fn: () => void) => () => {
    setOpen(false)
    fn()
  }
  return (
    <header className="topbar">
      {/* Every screen's top left: the logo, home, at the zoom icons' size (24px). (Zooming out is the bar's job.) */}
      <button className="logo-btn" onClick={onHome} aria-label="Home">
        <Logo size={24} />
      </button>
      {/* The middle of the bar: the day screen puts its date here (see Today), so the day has more room. */}
      <div className="topbar-center" id="topbar-center" />
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
            {/* About the app, not about you: set apart at the foot, quieter. Its page opens on the idea (the letter), then the rest (faq, get in touch, support, the small print). */}
            <button className="menu-idea" onClick={go(onIdea)}>
              about
            </button>
            {/* A private journal: signing out is always two taps away, the menu's last line. */}
            <button className="menu-signout" onClick={go(onSignOut)}>
              sign out
            </button>
          </nav>
        </div>
      )}
    </header>
  )
}
