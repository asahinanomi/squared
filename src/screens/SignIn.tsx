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
      {/* The brand, modest: the wave above the wordmark. */}
      <Logo size={48} />
      <h1 className="wordmark">
        squared<span>.today</span>
      </h1>
      {/* What squared is, for someone who's never seen it — then the question, the hero. */}
      <p className="signin-line">a life of 80 years is about 29,200 days. each one counts.</p>
      <p className="signin-question">
        did I spend <u>Today</u> meaningfully?
      </p>
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
    </main>
  )
}
