import { KOFI_URL } from '../lib/config'

// "help build squared": a short letter from the maker, and the way to support it (on Ko-fi, in a new tab).
// Found, never pushed: a tab of the about page.
export function Support() {
  return (
    <main className="idea support">
      <h1 className="idea-title">help build squared</h1>
      <p className="support-beta">
        <b className="beta">beta</b> squared is new, and still growing.
      </p>
      <p>
        I’m building squared myself, one square a day. I’d hate to let my days go by unnoticed. How sad that would be.
      </p>
      <p>If you feel the same, help me build it.</p>
      <p className="idea-sign">— nomi</p>
      <a className="pill support-go" href={KOFI_URL} target="_blank" rel="noopener noreferrer">
        support on Ko-fi →
      </a>
    </main>
  )
}
