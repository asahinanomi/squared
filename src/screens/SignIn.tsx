import { GoogleG } from '../components/GoogleG'
import { Logo } from '../components/Logo'

export function SignIn({
  onSignIn,
  onIdea,
  onPrivacy,
  error,
}: {
  onSignIn: () => void
  onIdea: () => void
  onPrivacy: () => void
  error?: string | null
}) {
  return (
    <main className="signin">
      {/* Three groups in one centred column: the brand, the message, sign-in. */}
      <header className="signin-brand">
        <Logo size={40} />
        <h1 className="wordmark">
          squared<span>.today</span>
          <b className="beta">beta</b>
        </h1>
      </header>
      {/* The number first — a life is finite — then the question it raises. */}
      <div className="signin-message">
        <p className="signin-number">29,200</p>
        <p className="signin-line">days in an 80-year life</p>
        <p className="signin-question">
          did I spend <u>Today</u> meaningfully?
        </p>
      </div>
      <div className="signin-go">
        <button className="signin-google" onClick={onSignIn}>
          <GoogleG />
          continue with Google
        </button>
        {error && <p className="signin-error">sign-in didn't finish: {error}</p>}
        {/* For someone new: why squared exists, and what it keeps, before signing in. */}
        <div className="signin-links">
          <button className="signin-idea" onClick={onIdea}>
            the idea
          </button>
          <span aria-hidden="true">·</span>
          <button className="signin-idea" onClick={onPrivacy}>
            privacy
          </button>
        </div>
      </div>
    </main>
  )
}
