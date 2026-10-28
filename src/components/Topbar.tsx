import { useEffect, useState } from 'react'
import { Logo } from './Logo'

type Props = {
  onHome: () => void
  onIdea: () => void
  onSettings: () => void
  onSignOut: () => void
}

export function Topbar({ onHome, onIdea, onSettings, onSignOut }: Props) {
  const [open, setOpen] = useState(false)
  const go = (fn: () => void) => () => {
    setOpen(false)
    fn()
  }
  // Scrolled: the page passes under the bar, so it gets its soft shadow.
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 2)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  return (
    <header className={'topbar' + (scrolled ? ' is-scrolled' : '')}>
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
            {/* today and my days live in the bar (always one tap away); the menu keeps the rare three, one list: about
                (the idea, faq, get in touch, support, the small print), settings, and signing out (a private journal:
                always two taps away). */}
            <button onClick={go(onIdea)}>about</button>
            <button onClick={go(onSettings)}>settings</button>
            <button onClick={go(onSignOut)}>sign out</button>
          </nav>
        </div>
      )}
    </header>
  )
}
