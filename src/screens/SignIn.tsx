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
        {/* The mark and the name as one lockup, the same width; "beta" lives in the footer. */}
        <header className="signin-brand">
          <Logo size={56} painting />
          <h1 className="wordmark">squared</h1>
        </header>
        {/* One message: how many days a life holds, then squared's line. */}
        <div className="signin-message">
          <p className="signin-line">
            An 80-year life is about <b>29,200</b> days.
          </p>
          <p className="signin-question">
            The past is painted.
            <br />
            Today is still yours.
          </p>
        </div>
        <div className="signin-go">
          <button className="signin-google" onClick={onSignIn}>
            <GoogleG />
            continue with Google
          </button>
          {/* Continuing is agreeing (there's no onboarding step for it now): 18 and over, the terms and privacy. */}
          <p className="signin-agree">
            by continuing, you’re 18+ and agree to the <button onClick={onTerms}>terms</button> and{' '}
            <button onClick={onPrivacy}>privacy policy</button>.
          </p>
          {error && <p className="signin-error">sign-in didn't finish: {error}</p>}
        </div>
      </div>
      {/* For someone new: why squared exists, and what it keeps, before signing in. Terms and privacy are linked
          once, in the line under the button. */}
      <Footer
        centred
        links={[
          ['the idea', onIdea],
          ['faq', onQuestions],
        ]}
      />
    </main>
  )
}
