import { useState, type ReactNode } from 'react'
import { PAINTS } from '../lib/paints'
import { Chevron, ChevronDown } from './Today'

type Props = {
  onBack?: () => void
  backLabel?: string
  /** Inside the idea page: "get in touch" and "support" switch to their tabs. */
  onTouch?: () => void
  onSupport?: () => void
}

/** A link to another tab inside the idea page, or the plain way there when this page stands alone. */
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
                  ? 'Red: no, I was busy, but none of it mattered.'
                  : 'Grey: I don’t know, I wasn’t paying attention.'}
            </span>
          ))}
        </span>
        There’s no wrong answer, only an honest one.
      </>,
    ],
    [
      'Can I repaint a day?',
      'Yes, any time. Sometimes it takes a while to understand how a day really felt. Dip another colour and paint over it, or tap “start over” under the square to begin again.',
    ],
    [
      'What does “painted on time” mean?',
      'You painted the day while it was still close: on the day itself, or the next day. Later than that, the square remembers when you painted it, and it’s a shade lighter. Memories soften too.',
    ],
    [
      'Why does a square say “repainted”?',
      'You painted it again, in another colour, after that window. That’s fine, nothing is locked. The square just keeps an honest record: what you felt then, and that you see it differently now.',
    ],
    [
      'Can I paint days I missed?',
      'Of course. Life gets busy, that’s why squared exists. Tap the date or swipe back to any day since your birthday.',
    ],
    [
      'What are notes for?',
      'For the why. What made the day feel that way, a moment you want to keep, or what you see now that you didn’t then. A day can hold as many as it needs.',
    ],
    [
      'What is “what matters”?',
      'Your own compass: what makes a day meaningful to you, and what makes one feel empty. When you’re torn between colours, squared gently reminds you what you said.',
    ],
    [
      'Is my data private?',
      'Yes. Your days are yours. Only you can see your squares and notes. No ads, no tracking, never sold. The privacy page has the details.',
    ],
    [
      'Can I get a copy of my data?',
      'Yes, any time: settings → export my data. You get a Word document to read, or a full copy to keep.',
    ],
    [
      'Can I delete my account?',
      'Yes: settings → account → delete my account. Everything goes, right away and for good. I’d be sad to see you go, but it’s always your choice.',
    ],
    [
      'Does squared cost anything?',
      <>
        Not while it’s in beta: everything is free. Building and running squared does cost money, though, so one day
        there may be a paid version to cover it. If that happens, I’ll let you know first.
      </>,
    ],
    [
      'How can I support squared?',
      <>
        Thank you for asking. I’m building it myself, one square a day, and every bit of support keeps it going:{' '}
        {go(onSupport, 'help build squared', 'the idea → support')}. Telling a friend helps too.
      </>,
    ],
    [
      'How do I keep it on my home screen?',
      'On iPhone, in Safari: Share → Add to Home Screen. On Android, in Chrome: ⋮ → Add to home screen. Then squared is one tap away, every day.',
    ],
    [
      'Where do I ask questions?',
      <>Ask me any time: {go(onTouch, 'get in touch', 'the idea → get in touch')}. I read every one.</>,
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
      <p className="idea-sign">— nomi</p>
    </main>
  )
}
