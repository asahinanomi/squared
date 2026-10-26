import { useEffect, useState } from 'react'
import { frameVars } from '../lib/paints'

// Framing a day, acted out for the help: the day screen's own square, links, light and frame (the same classes, so
// it can never drift from the real thing). A fingertip taps "frame it", the light sweeps, the frame settles; it holds,
// then the fingertip taps "unframe" and the frame lets go; and again. With reduce motion: the framed square, still.
export function FrameDemo() {
  const still = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
  const [step, setStep] = useState<'idle' | 'tap' | 'framed' | 'untap'>(still ? 'framed' : 'idle')
  const [shining, setShining] = useState(false)
  useEffect(() => {
    if (still) return
    const at: [number, () => void][] = [
      [900, () => setStep('tap')],
      [1350, () => (setStep('framed'), setShining(true))],
      [2550, () => setShining(false)],
      [4300, () => setStep('untap')],
      [4750, () => setStep('idle')],
    ]
    let timers: ReturnType<typeof setTimeout>[] = []
    const run = () => {
      timers = at.map(([ms, f]) => setTimeout(f, ms))
      timers.push(setTimeout(run, 6200))
    }
    run()
    return () => timers.forEach(clearTimeout)
  }, [still])
  const framed = step === 'framed' || step === 'untap'
  const tapping = step === 'tap' || step === 'untap'
  return (
    <div className="frame-demo" aria-hidden="true">
      <div
        className={'canvas' + (framed ? ' is-framed' : '') + (shining ? ' is-shining' : '')}
        style={frameVars('green')}
      >
        <div className="canvas-face is-painted" />
      </div>
      <div className="day-links">
        <span className="day-wipe">start over</span>
        <span className={'day-wipe' + (tapping ? ' is-tapped' : '')}>
          {framed ? 'unframe' : 'frame it'}
          {tapping && <i key={step} className="frame-demo-finger" />}
        </span>
      </div>
    </div>
  )
}
