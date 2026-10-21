import { useState } from 'react'
import { Feedback } from './Feedback'
import { Idea } from './Idea'
import { Questions } from './Questions'
import { Support } from './Support'

type Tab = 'idea' | 'questions' | 'touch' | 'support'
const TABS: [Tab, string][] = [
  ['idea', 'the idea'],
  ['questions', 'faq'],
  ['touch', 'get in touch'],
  ['support', 'support'],
]

type Props = {
  onMatters: () => void
  /** The small print, in the footer. */
  onLegal: (page: 'privacy' | 'terms') => void
}

// The idea, squared's about page: four tabs side by side (the letter first, so it's still what's read), then
// the small print. Each tab switches the page in place, like years · months · days.
export function About({ onMatters, onLegal }: Props) {
  const [tab, setTab] = useState<Tab>('idea')
  const show = (t: Tab) => {
    setTab(t)
    window.scrollTo(0, 0)
  }
  return (
    <div className="about">
      <div className="seg about-tabs" role="tablist" aria-label="About squared">
        {TABS.map(([t, label]) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            className={tab === t ? 'is-on' : undefined}
            onClick={() => show(t)}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === 'idea' ? (
        <Idea onMatters={onMatters} />
      ) : tab === 'questions' ? (
        <Questions onTouch={() => show('touch')} />
      ) : tab === 'touch' ? (
        <Feedback embedded onBack={() => show('idea')} />
      ) : (
        <Support />
      )}
      <footer className="idea-foot">
        <button onClick={() => onLegal('privacy')}>privacy</button>
        <span aria-hidden="true">·</span>
        <button onClick={() => onLegal('terms')}>terms</button>
      </footer>
    </div>
  )
}
