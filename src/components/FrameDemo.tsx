import { useEffect, useState } from 'react'
import { frameVars } from '../lib/paints'

// Framing a day, acted out for the help: the day screen's own square, links, light and frame (the same classes, so
// it can never drift from the real thing). As on the day (nomi, Nov 4, 2026: framing moved into "more"): a fingertip
// taps "more", a small "frame it" rises, the fingertip taps it, the light sweeps, the frame settles; it holds, lets go,
// and again. With reduce motion: the framed square, still.
export function FrameDemo() {
  const still = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
  const [step, setStep] = useState<'idle' | 'more' | 'menu' | 'tap' | 'framed'>(still ? 'framed' : 'idle')
  const [shining, setShining] = useState(false)
  useEffect(() => {
    if (still) return
    const at: [number, () => void][] = [
      [900, () => setStep('more')],
      [1300, () => setStep('menu')],
      [2100, () => setStep('tap')],
      [2550, () => (setStep('framed'), setShining(true))],
      [3750, () => setShining(false)],
      [5600, () => setStep('idle')],
    ]
    let timers: ReturnType<typeof setTimeout>[] = []
    const run = () => {
      timers = at.map(([ms, f]) => setTimeout(f, ms))
      timers.push(setTimeout(run, 6800))
    }
    run()
    return () => timers.forEach(clearTimeout)
  }, [still])
  const framed = step === 'framed'
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
        <span className={'day-wipe' + (step === 'more' ? ' is-tapped' : '')}>
          more
          {step === 'more' && <i className="frame-demo-finger" />}
        </span>
      </div>
      {/* The more sheet, in miniature: its "frame it" row. */}
      <span className={'frame-demo-menu' + (step === 'menu' || step === 'tap' ? ' is-open' : '')}>
        frame it
        {step === 'tap' && <i className="frame-demo-finger" />}
      </span>
    </div>
  )
}
