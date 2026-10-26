/**
 * Text with its ordinals raised, as squared writes them everywhere: "your 55th birthday", "Monday, Oct 12th, 2026".
 * The suffix sits up small, like the dates on the day screen and in the list; screen readers hear it whole.
 */
export function Raised({ text }: { text: string }) {
  const parts = text.split(/(\d+)(st|nd|rd|th)\b/)
  // split with two groups: [before, number, suffix, between, number, suffix, …, after]
  const out = []
  for (let i = 0; i < parts.length; i += 3) {
    out.push(parts[i])
    if (i + 2 < parts.length)
      out.push(
        <span key={i}>
          {parts[i + 1]}
          <sup className="ord">{parts[i + 2]}</sup>
        </span>,
      )
  }
  return <>{out}</>
}
