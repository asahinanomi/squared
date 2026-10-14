import { GoogleG } from '../components/GoogleG'
import { Logo } from '../components/Logo'

export function SignIn({ onSignIn, error }: { onSignIn: () => void; error?: string | null }) {
  return (
    <main className="signin">
      <Logo size={96} />
      <h1 className="wordmark">
        squared<span>.today</span>
      </h1>
      <button className="pill pill-google" onClick={onSignIn}>
        <span className="g-badge">
          <GoogleG />
        </span>
        continue with Google
      </button>
      {error && <p className="signin-error">Sign-in didn't finish: {error}</p>}
    </main>
  )
}
