import { useState } from 'react'
import { sendFeedback } from '../lib/feedback'
import { supabase } from '../lib/supabase'
import { Chevron } from './Today'

type Props = { onBack: () => void }

// Send feedback: one box, straight to the maker. Thanks once it's sent.
export function Feedback({ onBack }: Props) {
  const [text, setText] = useState('')
  const [state, setState] = useState<'writing' | 'sending' | 'sent' | 'failed'>('writing')
  const send = () => {
    setState('sending')
    sendFeedback(text.trim())
      .then(() => setState('sent'))
      .catch((e) => {
        console.error('Could not send feedback', e)
        setState('failed')
      })
  }
  return (
    <main className="settings feedback">
      <button className="setup-back" aria-label="Back" onClick={onBack}>
        <Chevron dir="left" />
      </button>
      <h1 className="settings-title">send feedback</h1>
      {state === 'sent' ? (
        <>
          <p className="feedback-lede">
            {supabase ? 'Thank you. I read every one. — nomi' : 'This is a demo, so nothing was sent.'}
          </p>
          <button className="pill feedback-send" onClick={onBack}>
            done
          </button>
        </>
      ) : (
        <>
          <p className="feedback-lede">
            what confused you, or felt off? what did your squares show you? anything helps.
          </p>
          <textarea
            className="feedback-input"
            value={text}
            maxLength={4000}
            placeholder="a line, or a page"
            aria-label="Your feedback"
            onChange={(e) => {
              setText(e.target.value)
              if (state === 'failed') setState('writing')
            }}
          />
          {state === 'failed' && <p className="feedback-error">couldn't send — check your connection and try again</p>}
          <button className="pill feedback-send" disabled={!text.trim() || state === 'sending'} onClick={send}>
            {state === 'sending' ? 'sending…' : 'send'}
          </button>
        </>
      )}
    </main>
  )
}
