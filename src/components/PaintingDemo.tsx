import { useEffect, useState } from 'react'
import type { Days } from '../lib/days'
import type { Paint } from '../lib/paints'
import { PaintingThumb } from './PaintingThumb'

// A finished month, made up for the demo (mostly worth it, a few regrets and blurs), so it shows the same painting
// for everyone, even before they've painted a day.
const MONTH = '2025-09'
const PATTERN: Paint[] = ['green', 'green', 'grey', 'green', 'red', 'green', 'green', 'grey', 'green', 'green']
const DEMO: Days = Object.fromEntries(
  Array.from({ length: 30 }, (_, i) => [
    `${MONTH}-${String(i + 1).padStart(2, '0')}`,
    { color: PATTERN[(i * 7) % 10] },
  ]),
)

// Keeping a painting, acted out for the help: the app's own painting and its "keep this painting" pill (the same
// drawing and classes). A fingertip taps it, and it becomes "download", as it does once a painting is kept; it holds,
// and starts again. With reduce motion: the painting and its pill, still.
export function PaintingDemo() {
  const still = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
  const [step, setStep] = useState<'idle' | 'tap' | 'kept'>('idle')
  useEffect(() => {
    if (still) return
    let timers: ReturnType<typeof setTimeout>[] = []
    const run = () => {
      timers = [
        setTimeout(() => setStep('tap'), 1100),
        setTimeout(() => setStep('kept'), 1550),
        setTimeout(() => setStep('idle'), 4200),
        setTimeout(run, 4800),
      ]
    }
    run()
    return () => timers.forEach(clearTimeout)
  }, [still])
  return (
    <div className="painting-demo" aria-hidden="true">
      <PaintingThumb month={MONTH} days={DEMO} />
      <span className="pill painting-keep">
        {step === 'kept' ? 'download' : 'keep this painting'}
        <svg
          viewBox="0 0 24 24"
          width="12"
          height="12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 4 V15 M7 10.5 L12 15.5 L17 10.5 M5 19.5 H19" />
        </svg>
        {step === 'tap' && <i className="frame-demo-finger" />}
      </span>
    </div>
  )
}
