import { Chevron } from './Today'

type Props = { onBack: () => void; backLabel: string }

// Privacy: what squared keeps, who can see it, what it never does, and how to delete it all — in plain words.
export function Privacy({ onBack, backLabel }: Props) {
  return (
    <main className="idea privacy">
      <button className="back-btn idea-back" onClick={onBack} aria-label={`Back to ${backLabel}`}>
        <Chevron dir="left" />
        {backLabel}
      </button>
      <h1 className="idea-title">privacy</h1>
      <p className="privacy-date">last updated Oct 22, 2026</p>
      <p>squared is a private journal. Here’s exactly what it keeps, and what it doesn’t.</p>
      <p>squared is in beta. I’ll do my best to carry your squares and notes over when it leaves beta (see terms).</p>

      <h2 className="privacy-head">what squared keeps</h2>
      <ul className="privacy-list">
        <li>Your email and name from Google, so you can sign in.</li>
        <li>Your birth date and how long you hope to live, to count your squares.</li>
        <li>The squares you paint, when you first painted each, and your notes.</li>
        <li>Your “what matters” lists.</li>
        <li>Anything you send through “get in touch”.</li>
        <li>
          When something goes wrong (a save that fails, a screen that breaks), a short technical note: what failed, the
          error, and your browser, so I can fix it.
        </li>
      </ul>
      <p>
        Everything is kept in your account, not on your phone. Your phone only remembers that you’re signed in, and
        small choices like sound on or off.
      </p>

      <h2 className="privacy-head">who can see it</h2>
      <ul className="privacy-list">
        <li>No one else using squared: everything is locked to your account.</li>
        <li>
          It’s stored with Supabase (the database), encrypted on their disks, and the site is served by Vercel. It isn’t
          end-to-end encrypted: as the maker, I can reach the database to keep it running and safe, but I don’t read
          your squares or notes.
        </li>
        <li>
          Feedback is the exception: it’s for me, so I read it. It’s emailed to me (through Resend) with your email, so
          I can reply.
        </li>
      </ul>

      <h2 className="privacy-head">what squared never does</h2>
      <p>No ads inside squared. Your squares, notes and lists are never sold or shared.</p>

      <h2 className="privacy-head">deleting it all</h2>
      <p>
        Any time: settings → delete my account. It removes your account and everything above, for good, right away. You
        can also download a copy first: settings → export my data.
      </p>

      <h2 className="privacy-head">questions</h2>
      <p>Use “get in touch” (on the about page), or reply to any email from me.</p>
      <p className="idea-sign">— nomi</p>
    </main>
  )
}
