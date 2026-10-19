import { useState } from 'react'
import { Logo } from './Logo'
import { Chevron } from '../screens/Today'
import { FEEDBACK_URL } from '../lib/config'

type Props = {
  onHome: () => void
  onCalendar: () => void
  onIdea: () => void
  onSettings: () => void
  onSignOut: () => void
  /** On a zoom level: one level out, labelled with where it lands ("2026", "a life"). Replaces the logo. */
  back?: { label: string; onBack: () => void }
}

export function Topbar({ onHome, onCalendar, onIdea, onSettings, onSignOut, back }: Props) {
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
            <button onClick={go(onHome)}>today</button>
            <button onClick={go(onCalendar)}>my squares</button>
            <button onClick={go(onSettings)}>settings</button>
            <button onClick={go(onSignOut)}>sign out</button>
            {/* About the app, not about you: set apart at the foot, quieter. */}
            <button className="menu-idea" onClick={go(onIdea)}>
              the idea
            </button>
            {FEEDBACK_URL && (
              <a className="menu-feedback" href={FEEDBACK_URL} target="_blank" rel="noopener noreferrer">
                send feedback
              </a>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
