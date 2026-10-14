import { GoogleG } from '../components/GoogleG'
import { Logo } from '../components/Logo'

export function SignIn({ onSignIn }: { onSignIn: () => void }) {
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
    </main>
  )
}
