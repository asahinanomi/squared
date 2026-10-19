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
      <Logo size={48} />
      <h1 className="wordmark">
        squared<span>.today</span>
      </h1>
      {/* What squared is, for someone who's never seen it: the number, the square, the habit, the question. */}
      <p className="signin-line">
        <span>A life of 80 years is about 29,200 days.</span>
        <span>Each one is a square.</span>
        <span>Paint one a day:</span>
      </p>
      <p className="signin-question">
        did I spend <u>Today</u>
        <br />
        meaningfully?
      </p>
      <button className="pill pill-google" onClick={onSignIn}>
        <span className="g-badge">
          <GoogleG />
        </span>
        continue with Google
      </button>
      {error && <p className="signin-error">sign-in didn't finish: {error}</p>}
      {/* For someone new: why squared exists, before signing in. */}
      <div className="signin-links">
        <button className="signin-idea" onClick={onIdea}>
          the idea
        </button>
        <button className="signin-idea" onClick={onPrivacy}>
          privacy
        </button>
      </div>
    </main>
  )
}
