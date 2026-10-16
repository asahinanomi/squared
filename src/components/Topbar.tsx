import { useState } from 'react'
import { Logo } from './Logo'
import { Chevron } from '../screens/Today'

type Props = {
  onHome: () => void
  onCalendar: () => void
  onIdea: () => void
  onSetup: () => void
  onSignOut: () => void
  /** On a zoom level: one level out, labelled with where it lands ("2026", "a life"). Replaces the logo. */
  back?: { label: string; onBack: () => void }
}

export function Topbar({ onHome, onCalendar, onIdea, onSetup, onSignOut, back }: Props) {
  const [open, setOpen] = useState(false)
  const go = (fn: () => void) => () => {
    setOpen(false)
    fn()
  }
  return (
    <header className="topbar">
      {back ? (
        <button className="back-btn" onClick={back.onBack} aria-label={`Back to ${back.label}`}>
          <Chevron dir="left" />
          {back.label}
        </button>
      ) : (
        <button className="logo-btn" onClick={onHome} aria-label="Today">
          <Logo />
        </button>
      )}
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
            <button onClick={go(onCalendar)}>my squares</button>
            <button onClick={go(onIdea)}>the idea</button>
            <button onClick={go(onSetup)}>how many squares?</button>
            <button onClick={go(onSignOut)}>sign out</button>
          </nav>
        </div>
      )}
    </header>
  )
}
