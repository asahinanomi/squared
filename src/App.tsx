import { Logo } from './components/Logo'
import './App.css'

// Step 1 shell: app frame, type and background only. Screens arrive in step 2.
export default function App() {
  return (
    <div className="app">
      <header className="topbar">
        <Logo />
        <button className="menu-btn" aria-label="Menu">
          <span />
          <span />
        </button>
      </header>
      <main className="stage">
        <h1 className="wordmark">
          squared<span>.today</span>
        </h1>
        <p className="note">step 1 — shell is alive</p>
      </main>
    </div>
  )
}
