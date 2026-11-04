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

// Finding a painting, acted out for the help, with the app's own pieces (a month's name with its dotted underline and small
// picture, the painting, its "download" pill). A fingertip taps "September 2025", the painting opens; it taps "download"; it holds,
// and starts again. With reduce motion: the month's name and its painting, open, still.
export function PaintingDemo() {
  const still = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
  const [step, setStep] = useState<'list' | 'find' | 'open' | 'tap' | 'kept'>(still ? 'open' : 'list')
  useEffect(() => {
    if (still) return
    let timers: ReturnType<typeof setTimeout>[] = []
    const run = () => {
      setStep('list')
      timers = [
        setTimeout(() => setStep('find'), 900),
        setTimeout(() => setStep('open'), 1350),
        setTimeout(() => setStep('tap'), 2700),
        setTimeout(() => setStep('kept'), 3150),
        setTimeout(run, 5600),
      ]
    }
    run()
    return () => timers.forEach(clearTimeout)
  }, [still])
  const open = step === 'open' || step === 'tap' || step === 'kept'
  return (
    <div className="painting-demo" aria-hidden="true">
      {/* Where it lives: a month's name, its dotted underline (as in the month view and the list). */}
      <span className="painting-demo-row">
        {/* The same as the real one (PaintingButton): the name, then its small picture (nomi, Nov 4, 2026: the demo
            predated the picture). */}
        <span className={'painting-name' + (step === 'find' ? ' is-on' : '')}>
          <span className="painting-label">September 2025</span>
          <svg className="painting-icon" viewBox="0 0 24 24">
            <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
            <path d="M7 15.5 10.5 11.5 13 14l2-2 2 3.5" />
          </svg>
          {step === 'find' && <i className="frame-demo-finger" />}
        </span>
      </span>
      <span className={'painting-demo-open' + (open ? ' is-open' : '')}>
        <PaintingThumb month={MONTH} days={DEMO} />
        <span className="pill painting-keep">
          download
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
      </span>
    </div>
  )
}
