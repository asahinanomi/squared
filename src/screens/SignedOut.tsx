import { useState } from 'react'
import { signInWithGoogle } from '../lib/supabase'
import { demo, ideaAtStart, leaveLegalUrl, legalAt } from '../state/app'
import { Idea } from './Idea'
import { Privacy } from './Privacy'
import { Questions } from './Questions'
import { SignIn } from './SignIn'
import { Terms } from './Terms'

type Props = { error: string | null; onDemoSignIn: () => void }

// Signed out: the sign-in screen, and what it links to (the idea, privacy, terms, questions). Opened straight from
// its web address (squared.today/terms), a page shows first; back leads to sign-in.
export function SignedOut({ error, onDemoSignIn }: Props) {
  const [page, setPage] = useState<'idea' | 'privacy' | 'terms' | 'questions' | null>(
    () => legalAt() ?? (ideaAtStart ? 'idea' : null),
  )
  const back = () => {
    leaveLegalUrl()
    setPage(null)
  }
  if (page === 'idea')
    return (
      <div className="app">
        <Idea
          onBack={() => {
            if (location.pathname === '/idea') history.replaceState(null, '', '/')
            setPage(null)
          }}
        />
      </div>
    )
  if (page === 'privacy')
    return (
      <div className="app">
        <Privacy onBack={back} backLabel="sign in" />
      </div>
    )
  if (page === 'questions')
    return (
      <div className="app">
        <Questions onBack={back} backLabel="sign in" />
      </div>
    )
  if (page === 'terms')
    return (
      <div className="app">
        <Terms onBack={back} backLabel="sign in" />
      </div>
    )
  return (
    <SignIn
      error={error}
      onSignIn={demo ? onDemoSignIn : signInWithGoogle}
      onIdea={() => setPage('idea')}
      onPrivacy={() => setPage('privacy')}
      onTerms={() => setPage('terms')}
      onQuestions={() => setPage('questions')}
    />
  )
}
