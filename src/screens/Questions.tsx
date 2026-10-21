import { Chevron } from './Today'

type Props = {
  onBack?: () => void
  backLabel?: string
  /** Inside the idea page: "get in touch" switches to its tab. */
  onTouch?: () => void
}

const QA: [string, string][] = [
  [
    'What do the three colours mean?',
    'Green: yes, I spent it on what matters. Red: no, I was busy, but none of it mattered. Grey: I don’t know, I wasn’t paying attention. There’s no wrong answer, only an honest one.',
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
    'Why does a square say “changed”?',
    'You changed its colour after that window. That’s fine, nothing is locked. The square just keeps an honest record: what you felt then, and that you see it differently now.',
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
    'Yes. Your days are yours. Only you can see your squares and notes. No ads, no tracking, never sold. Privacy has the details.',
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
    'No, it’s free while in beta. I’m building it myself, one square a day. If it helps you, you can help build it: the idea → help build squared.',
  ],
  [
    'How do I keep it on my home screen?',
    'On iPhone, in Safari: Share → Add to Home Screen. On Android, in Chrome: ⋮ → Add to home screen. Then squared is one tap away, every day.',
  ],
]

// Questions: the few rules squared has, answered once, so the screens can stay quiet. Privacy's paper.
export function Questions({ onBack, backLabel = 'back', onTouch }: Props) {
  return (
    <main className="idea privacy">
      {onBack && (
        <>
          <button className="back-btn idea-back" onClick={onBack} aria-label={`Back to ${backLabel}`}>
            <Chevron dir="left" />
            {backLabel}
          </button>
          <h1 className="idea-title">faq</h1>
        </>
      )}
      {QA.map(([q, a]) => (
        <section key={q}>
          <h2 className="privacy-head">{q}</h2>
          <p>{a}</p>
        </section>
      ))}
      <h2 className="privacy-head">Something else?</h2>
      <p>
        {onTouch ? (
          <>
            Ask me:{' '}
            <button className="idea-inline" onClick={onTouch}>
              get in touch
            </button>
            . I read every one.
          </>
        ) : (
          'Ask me: the idea → get in touch. I read every one.'
        )}
      </p>
      <p className="idea-sign">— nomi</p>
    </main>
  )
}
