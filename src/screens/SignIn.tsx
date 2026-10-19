import { GoogleG } from '../components/GoogleG'
import { Logo } from '../components/Logo'

export function SignIn({
  onSignIn,
  onIdea,
  error,
}: {
  onSignIn: () => void
  onIdea: () => void
  error?: string | null
}) {
  return (
    <main className="signin">
      <Logo size={96} />
      <h1 className="wordmark">
        squared<span>.today</span>
      </h1>
      {/* What squared is, in one line, for someone who's never seen it. */}
      <p className="signin-line">Paint one square a day: did I spend Today meaningfully?</p>
      <button className="pill pill-google" onClick={onSignIn}>
        <span className="g-badge">
          <GoogleG />
        </span>
        continue with Google
      </button>
      {error && <p className="signin-error">sign-in didn't finish: {error}</p>}
      {/* For someone new: why squared exists, before signing in. */}
      <button className="signin-idea" onClick={onIdea}>
        the idea
      </button>
    </main>
  )
}
