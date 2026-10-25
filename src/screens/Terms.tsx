import { Chevron } from './Today'

type Props = {
  onBack: () => void
  backLabel: string
}

// Terms: the few rules of using squared, in plain words, in privacy's paper.
export function Terms({ onBack, backLabel }: Props) {
  return (
    <main className="idea privacy">
      <button className="back-btn idea-back" onClick={onBack} aria-label={`Back to ${backLabel}`}>
        <Chevron dir="left" />
        {backLabel}
      </button>
      <h1 className="idea-title">terms</h1>
      <p>squared is a small app made by one person. By using it, you agree to these few things.</p>

      <h2 className="privacy-head">it’s a beta, as is</h2>
      <p>
        squared is in beta. It’s offered as is, with no promise that it will always work, be available, or keep your
        squares and moments. I do my best to look after them, but things can break.
      </p>

      <h2 className="privacy-head">lost data</h2>
      <p>
        I’m not responsible for any lost or damaged data, or for anything that follows from it. If something matters to
        you, keep your own copy too (settings → export my data).
      </p>

      <h2 className="privacy-head">your words are yours</h2>
      <p>What you paint and write belongs to you. squared only keeps it to show it back to you (see privacy).</p>

      <h2 className="privacy-head">support</h2>
      <p>Support through Ko-fi is a gift to help build squared. It isn’t a purchase and doesn’t buy features.</p>

      <h2 className="privacy-head">using it fairly</h2>
      <p>You must be 18 or older. Don’t misuse squared, try to break it, or reach into anyone else’s account.</p>

      <h2 className="privacy-head">changes</h2>
      <p>
        squared may change, or one day end. I’ll try to give notice first. You can delete your account any time:
        settings → delete my account.
      </p>

      <h2 className="privacy-head">questions</h2>
      <p>Use “get in touch” (on the about page), or reply to any email from me.</p>
      <p className="idea-sign">— nomi</p>
      {/* The date it last changed, required for a privacy policy: quiet, at the foot. */}
      <p className="privacy-date">last updated Oct 24, 2026</p>
    </main>
  )
}
