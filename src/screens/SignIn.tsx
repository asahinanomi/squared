import { Footer } from '../components/Footer'
import { GoogleG } from '../components/GoogleG'
import { Logo } from '../components/Logo'

export function SignIn({
  onSignIn,
  onIdea,
  onPrivacy,
  onTerms,
  onQuestions,
  error,
}: {
  onSignIn: () => void
  onIdea: () => void
  onPrivacy: () => void
  onTerms: () => void
  onQuestions: () => void
  error?: string | null
}) {
  return (
    <main className="signin">
      {/* The message and sign-in, centred in the screen; the small print at its foot. */}
      <div className="signin-body">
        {/* Three groups in one centred column: the brand, the message, sign-in. */}
        <header className="signin-brand">
          <Logo size={40} painting />
          <h1 className="wordmark">
            squared<span>.today</span>
            <b className="beta">beta</b>
          </h1>
        </header>
        {/* The number first — a life is finite — then the question it raises. */}
        <div className="signin-message">
          <p className="signin-there">there are</p>
          <p className="signin-number">29,200</p>
          <p className="signin-line">days in an 80-year life</p>
          <p className="signin-question">
            am I spending <u>Today</u> meaningfully?
          </p>
        </div>
        <div className="signin-go">
          <button className="signin-google" onClick={onSignIn}>
            <GoogleG />
            continue with Google
          </button>
          {error && <p className="signin-error">sign-in didn't finish: {error}</p>}
        </div>
      </div>
      {/* For someone new: why squared exists, and what it keeps, before signing in. */}
      <Footer
        centred
        links={[
          ['the idea', onIdea],
          ['faq', onQuestions],
          ['privacy', onPrivacy],
          ['terms', onTerms],
        ]}
      />
    </main>
  )
}
