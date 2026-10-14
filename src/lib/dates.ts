/** Local calendar date as YYYY-MM-DD (never UTC — a day is the day where you are). */
export function isoDate(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export function fromIso(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const todayIso = () => isoDate(new Date())

export function addDays(iso: string, n: number): string {
  const d = fromIso(iso)
  d.setDate(d.getDate() + n)
  return isoDate(d)
}

export const sameMonth = (a: string, b: string) => a.slice(0, 7) === b.slice(0, 7)

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

/** "Monday, Oct 12th, 2026" */
export function longDate(iso: string): string {
  const d = fromIso(iso)
  const weekday = d.toLocaleDateString('en-US', { weekday: 'long' })
  const month = d.toLocaleDateString('en-US', { month: 'short' })
  return `${weekday}, ${month} ${ordinal(d.getDate())}, ${d.getFullYear()}`
}

/** "October 2026" */
export const monthTitle = (iso: string) =>
  fromIso(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

/** Monday-first month layout: leading nulls, then every date in the month. */
export function monthCells(iso: string): (string | null)[] {
  const d = fromIso(iso)
  const first = new Date(d.getFullYear(), d.getMonth(), 1)
  const days = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  const lead = (first.getDay() + 6) % 7
  const cells: (string | null)[] = Array(lead).fill(null)
  for (let i = 1; i <= days; i++) cells.push(isoDate(new Date(d.getFullYear(), d.getMonth(), i)))
  return cells
}
