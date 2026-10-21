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
      <p className="privacy-date">last updated Oct 19, 2026</p>
      <p>squared is a private journal. Here’s exactly what it keeps, and what it doesn’t.</p>
      <p>squared is in beta. I’ll do my best to carry your squares and notes over when it leaves beta (see terms).</p>

      <h2 className="privacy-head">what squared keeps</h2>
      <ul className="privacy-list">
        <li>Your email and name from Google, so you can sign in.</li>
        <li>Your birth date and how long you hope to live, to count your squares.</li>
        <li>The squares you paint, when you first painted each, and your notes.</li>
        <li>Your “what matters” lists.</li>
        <li>Anything you send through “get in touch”.</li>
      </ul>
      <p>A copy of your settings and lists also stays on your phone, so squared opens quickly.</p>

      <h2 className="privacy-head">who can see it</h2>
      <ul className="privacy-list">
        <li>Only you. Everything is locked to your account.</li>
        <li>
          It’s stored with Supabase (the database) and the site is served by Vercel. As the maker, I can reach the
          database to keep it running, but I don’t read your squares or notes.
        </li>
        <li>
          Feedback is the exception: it’s for me, so I read it. It’s emailed to me (through Resend) with your email, so
          I can reply.
        </li>
      </ul>

      <h2 className="privacy-head">what squared never does</h2>
      <p>No ads, no tracking, no analytics that follow you. Your data is never sold or shared.</p>

      <h2 className="privacy-head">deleting it all</h2>
      <p>
        Any time: settings → account → delete my account. It removes your account and everything above, for good, right
        away.
      </p>

      <h2 className="privacy-head">questions</h2>
      <p>Use “get in touch” (on the idea page), or reply to any email from me.</p>
      <p className="idea-sign">— nomi</p>
    </main>
  )
}
