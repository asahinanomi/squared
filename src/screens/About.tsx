import { useEffect, useState } from 'react'
import { endTouchLink, touchAtStart } from '../state/app'
import { Footer } from '../components/Footer'
import { Feedback } from './Feedback'
import { Idea } from './Idea'
import { Questions } from './Questions'
import { Support } from './Support'

type Tab = 'idea' | 'questions' | 'touch' | 'support'
const TABS: [Tab, string][] = [
  ['idea', 'about'],
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
  // squared.today/?touch opens straight on get in touch (the testers' link).
  const [tab, setTab] = useState<Tab>(touchAtStart ? 'touch' : 'idea')
  useEffect(endTouchLink, [])
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
        <Questions onTouch={() => show('touch')} onSupport={() => show('support')} />
      ) : tab === 'touch' ? (
        <Feedback onDone={() => show('idea')} />
      ) : (
        <Support />
      )}
      <Footer
        links={[
          ['privacy', () => onLegal('privacy')],
          ['terms', () => onLegal('terms')],
        ]}
      />
    </div>
  )
}
