import { useEffect, useState } from 'react'
import { Glass } from './LifeGlass'

/** A wait (finishing sign-in, loading your days): nothing at first, then, past half a second, the hourglass,
 *  its sand falling, alone in the middle of the paper. */
export function Waiting() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 500)
    return () => clearTimeout(t)
  }, [])
  if (!show) return null
  return (
    <div className="waiting" role="status" aria-label="Loading">
      <Glass left={0.6} />
    </div>
  )
}
