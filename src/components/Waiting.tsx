import { Glass } from './LifeGlass'

/** A wait (finishing sign-in, loading your days): the hourglass, alone in the middle of the paper, its sand
 *  running down, then turned over, again and again, until squared is ready. */
export function Waiting() {
  return (
    <div className="waiting" role="status" aria-label="Loading">
      <Glass left={0.5} />
    </div>
  )
}
