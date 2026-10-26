import { useState, type ReactNode } from 'react'
import { PAINTS } from '../lib/paints'
import { Chevron, ChevronDown } from './Today'

type Props = {
  onBack?: () => void
  backLabel?: string
  /** Inside the about page: "get in touch" and "support" switch to their tabs. */
  onTouch?: () => void
  onSupport?: () => void
}

/** A link to another tab inside the about page, or the plain way there when this page stands alone. */
const go = (to: (() => void) | undefined, label: string, path: string) =>
  to ? (
    <button className="idea-inline" onClick={to}>
      {label}
    </button>
  ) : (
    path
  )

function answers(onTouch?: () => void, onSupport?: () => void): [string, ReactNode][] {
  return [
    [
      'What do the three colours mean?',
      <>
        <span className="faq-colours">
          {PAINTS.map((p) => (
            <span key={p.id}>
              <span className="whisper-dot" style={{ background: p.hex }} aria-hidden="true" />
              {p.id === 'green'
                ? 'Green: yes, I spent it on what matters.'
                : p.id === 'red'
                  ? 'Red: no, I wish I’d spent it differently.'
                  : 'Grey: I don’t know, I wasn’t paying attention.'}
            </span>
          ))}
        </span>
        There’s no wrong answer, only an honest one.
      </>,
    ],
    [
      'Can I repaint a day?',
      'Yes, any time. Sometimes it takes a while to understand how a day really felt. Tap “start over” under the square, and paint it again.',
    ],
    [
      'Can I paint days I missed?',
      'Of course. Life gets busy, that’s why squared exists. Tap the date at the top of any day, or swipe back, and pick the day.',
    ],
    [
      'What are moments for?',
      'To catch the day as you live it, and as you look back on it. Before you paint today, squared asks “right now…”; after you paint, “because…”: why the day was worth it, a regret, or a blur. Each keeps its time. A day can hold as many moments as it needs.',
    ],
    [
      'What is “what matters”?',
      'Your own compass: what makes a day worth it to you, and what you’d regret. When you’re torn between colours, squared gently reminds you what you said.',
    ],
    [
      'Is my data private?',
      'Your squares and moments are locked to your account: no one else using squared can see them. They’re stored with Supabase and encrypted on its disks, but not end-to-end, so as the maker I can reach the database to keep it running. I don’t read your squares or moments. No ads inside squared, and your data is never sold. The privacy page has the details.',
    ],
    [
      'Can I get a copy of my data?',
      'Yes, any time: settings → export my data. You get a Word document to read, or a full copy to keep.',
    ],
    [
      'Can I delete my account?',
      'Yes: settings → delete my account. Your squares, moments, lists and settings go, right away and for good. I’d be sad to see you go, but it’s always your choice.',
    ],
    [
      'Is squared free?',
      <>
        Yes. While it’s in beta, everything is free. After beta, I plan to keep a free version so anyone can use it, and
        donations are welcome. I’d like to offer a paid version too one day, but I can’t promise it: I’m one person
        building this.
      </>,
    ],
    [
      'How can I support squared?',
      <>
        Thank you for asking. I’m building it myself, one square a day, and every bit of support keeps it going:{' '}
        {go(onSupport, 'help build squared', 'about → support')}. Telling a friend helps too.
      </>,
    ],
    [
      'How do I keep it on my home screen?',
      'On iPhone, in Safari or Chrome: Share → Add to Home Screen. On Android, in Chrome: ⋮ → Add to home screen. Then squared is one tap away, every day.',
    ],
    [
      'Where do I ask questions?',
      <>Ask me any time: {go(onTouch, 'get in touch', 'about → get in touch')}. I read every message.</>,
    ],
  ]
}

// The faq: the few rules squared has, answered once, so the screens can stay quiet. Each question opens its
// answer in place (one at a time), marked with a small Q and a big A. Privacy's paper.
export function Questions({ onBack, backLabel = 'back', onTouch, onSupport }: Props) {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <main className="idea privacy faq">
      {onBack && (
        <button className="back-btn idea-back" onClick={onBack} aria-label={`Back to ${backLabel}`}>
          <Chevron dir="left" />
          {backLabel}
        </button>
      )}
      <h1 className="idea-title">faq</h1>
      {answers(onTouch, onSupport).map(([q, a], i) => (
        <section key={q} className={'faq-item' + (open === i ? ' is-open' : '')}>
          <button className="faq-q" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>
            <span className="faq-mark" aria-hidden="true">
              Q
            </span>
            <span className="faq-text">{q}</span>
            <ChevronDown className="faq-chevron" />
          </button>
          {open === i && (
            <div className="faq-a">
              <span className="faq-big" aria-hidden="true">
                A
              </span>
              <p>{a}</p>
            </div>
          )}
        </section>
      ))}
    </main>
  )
}
