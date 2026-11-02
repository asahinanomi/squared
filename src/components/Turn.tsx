/** Words or a number turning over, like a day picker's wheel: what stays, stays; the rest rolls (the old down and away,
 *  the new in from above). Until `go`, the old shows still. Used by the days ahead (my days) and the date (today). */
export function Turn({ from, to, go = true }: { from: string; to: string; go?: boolean }) {
  if (from === to) return <>{to}</>
  if (!go) return <>{from}</>
  let k = 0
  while (k < to.length && k < from.length && to[k] === from[k]) k++
  // Only whole words or numbers roll: back up to the start of the one that changed ("Oct 9" → "Oct 10" rolls "9").
  while (k > 0 && /[\p{L}\p{N}]/u.test(to[k - 1])) k--
  return (
    <>
      {to.slice(0, k)}
      <span className="roll">
        <span className="roll-out">{from.slice(k)}</span>
        <span className="roll-in">{to.slice(k)}</span>
      </span>
    </>
  )
}
