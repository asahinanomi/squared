import { useState } from 'react'
import { sendFeedback } from '../lib/feedback'
import { supabase } from '../lib/supabase'

type Props = {
  /** After it's sent, "done" leads on (back to the idea). */
  onDone: () => void
}

// Get in touch (a tab of the idea): one box, straight to the maker, for anything (feedback, questions, bugs,
// hello). Thanks once sent.
export function Feedback({ onDone }: Props) {
  const [text, setText] = useState('')
  const [state, setState] = useState<'writing' | 'sending' | 'sent' | 'failed' | 'limit'>('writing')
  const send = () => {
    setState('sending')
    sendFeedback(text.trim())
      .then(() => setState('sent'))
      .catch((e) => {
        console.error('Could not send feedback', e)
        setState(String((e as { message?: string })?.message).includes('feedback limit') ? 'limit' : 'failed')
      })
  }
  return (
    <main className="settings feedback">
      <h1 className="idea-title">get in touch</h1>
      {state === 'sent' ? (
        <>
          <p className="feedback-lede">
            {supabase ? 'Thank you. I read every message. — nomi' : 'This is a demo, so nothing was sent.'}
          </p>
          <button className="pill feedback-send" onClick={onDone}>
            done
          </button>
        </>
      ) : (
        <>
          <p className="feedback-lede">
            a question, a bug, an idea, or just hello. squared is in beta, so what you tell me shapes it. I read every
            one.
          </p>
          <textarea
            className="feedback-input"
            value={text}
            maxLength={4000}
            placeholder="a line, or a page"
            aria-label="Your feedback"
            onChange={(e) => {
              setText(e.target.value)
              if (state === 'failed' || state === 'limit') setState('writing')
            }}
          />
          {state === 'failed' && <p className="feedback-error">couldn't send, check your connection and try again</p>}
          {state === 'limit' && (
            <p className="feedback-error">that's today's limit of five messages. thank you, send more tomorrow</p>
          )}
          <button className="pill feedback-send" disabled={!text.trim() || state === 'sending'} onClick={send}>
            {state === 'sending' ? 'sending…' : 'send'}
          </button>
        </>
      )}
    </main>
  )
}
