import { useState } from 'react'
import { exportJson, exportWord, type Everything } from '../lib/exportData'
import { Chevron } from './Today'

type Props = {
  onBack: () => void
  /** Gathers everything to export: every day, every note, the lists and the profile. */
  gather: () => Promise<Everything>
}

// Export my data: a Word copy to read anywhere, and a full copy (JSON) to keep. Both made on the phone.
export function Export({ onBack, gather }: Props) {
  const [state, setState] = useState<'idle' | 'working' | 'done' | 'failed'>('idle')
  const run = (make: (all: Everything) => unknown) => {
    setState('working')
    gather()
      .then(async (all) => {
        await make(all)
        setState('done')
      })
      .catch((e) => {
        console.error('Could not export', e)
        setState('failed')
      })
  }
  return (
    <main className="settings export">
      <button className="back-btn page-back" onClick={onBack} aria-label={`Back to ${'settings'}`}>
        <Chevron dir="left" />
        {'settings'}
      </button>
      <h1 className="settings-title">export my data</h1>
      <p className="feedback-lede">
        a copy of your squares, your notes and what matters to you, as a Word document. it opens in Word, Google Docs or
        Pages.
      </p>
      {state === 'done' && <p className="export-note">saved to your downloads.</p>}
      {state === 'failed' && <p className="export-note">couldn't export, check your connection and try again</p>}
      <button className="pill export-go" disabled={state === 'working'} onClick={() => run(exportWord)}>
        {state === 'working' ? 'preparing…' : 'download (Word)'}
      </button>
      <button className="export-json" disabled={state === 'working'} onClick={() => run(exportJson)}>
        also download a full copy (.json)
      </button>
      {/* Most people won't know what a .json is: say what it's for, plainly. */}
      <p className="export-why">
        the full copy is a backup, not for reading. it keeps everything exactly, so your squares can be brought back one
        day, into squared or another app.
      </p>
    </main>
  )
}
