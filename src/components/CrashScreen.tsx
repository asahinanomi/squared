import { Component, type ReactNode } from 'react'
import { reportError } from '../lib/report'

// If a screen ever breaks, this shows instead of a blank page: one plain line and "reload". What broke is written
// down (client_errors), so it can be fixed at the root. Saved days and notes are in the account, untouched.
export class CrashScreen extends Component<{ children: ReactNode }, { broken: boolean }> {
  state = { broken: false }
  static getDerivedStateFromError() {
    return { broken: true }
  }
  componentDidCatch(error: unknown) {
    console.error('squared crashed', error)
    reportError('crash', error)
  }
  render() {
    if (!this.state.broken) return this.props.children
    return (
      <main className="load-failed">
        <p>Something went wrong. Your squares are safe in your account.</p>
        <button className="pill" onClick={() => location.reload()}>
          reload
        </button>
      </main>
    )
  }
}
