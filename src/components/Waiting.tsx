import { useEffect, useState } from 'react'
import { Glass } from './LifeGlass'

/** A wait (finishing sign-in, loading your days): the hourglass, alone in the middle of the paper, its sand
 *  running down, then turned over, again and again, until squared is ready. */
export function Waiting({ line, later }: { line?: string; later?: string }) {
  // A second line after a few seconds, so a slow wait doesn't feel stuck.
  const [late, setLate] = useState(false)
  useEffect(() => {
    if (!later) return
    const t = setTimeout(() => setLate(true), 5000)
    return () => clearTimeout(t)
  }, [later])
  return (
    <div className="waiting" role="status" aria-label={line ?? 'Loading'}>
      <div className="waiting-in">
        <Glass left={0.5} />
        {line && <p className="waiting-line">{late && later ? later : line}</p>}
      </div>
    </div>
  )
}
