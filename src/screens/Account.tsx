import { useState } from 'react'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { deleteMyAccount } from '../lib/account'
import { Chevron } from './Today'

type Props = {
  /** The signed-in email, if known. */
  email?: string
  onBack: () => void
  onSignOut: () => void
  /** After the account is gone: back to the sign-in screen. */
  onDeleted: () => void
}

// Account: who you're signed in as, signing out, and deleting it all — asked once more before it goes.
export function Account({ email, onBack, onSignOut, onDeleted }: Props) {
  const [asking, setAsking] = useState(false)
  const [state, setState] = useState<'idle' | 'deleting' | 'failed'>('idle')
  const remove = () => {
    setAsking(false)
    setState('deleting')
    deleteMyAccount()
      .then(onDeleted)
      .catch((e) => {
        console.error('Could not delete the account', e)
        setState('failed')
      })
  }
  return (
    <main className="settings account">
      <button className="setup-back" aria-label="Back" onClick={onBack}>
        <Chevron dir="left" />
      </button>
      <h1 className="settings-title">account</h1>
      <p className="account-email">{email ? `Signed in as ${email}` : 'Signed in'}</p>
      <button className="account-signout" onClick={onSignOut}>
        sign out
      </button>

      <div className="account-danger">
        <p className="account-note">
          Deleting your account removes it and everything in it — your squares, notes, lists and settings — for good.
        </p>
        {state === 'failed' && <p className="account-note">couldn't delete — check your connection and try again</p>}
        <button className="account-delete" disabled={state === 'deleting'} onClick={() => setAsking(true)}>
          {state === 'deleting' ? 'deleting…' : 'delete my account'}
        </button>
      </div>

      {asking && (
        <ConfirmDialog
          title="Delete your account?"
          body="Your squares, notes and lists go for good. It can't be undone."
          confirm="delete"
          onConfirm={remove}
          onCancel={() => setAsking(false)}
        />
      )}
    </main>
  )
}
