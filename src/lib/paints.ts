export type Paint = 'green' | 'grey' | 'red'

// Always in this order: green, red, grey (worth it, regret, a blur).
// hex: the paint itself, on the day's canvas. soft: one shade lighter, every square in the overviews (month, list,
// year, a life), however late it was painted. A framed day keeps the full paint there, framed in FRAME.
export const PAINTS: { id: Paint; hex: string; soft: string; meaning: string }[] = [
  { id: 'green', hex: '#6E9B7B', soft: '#A7C4B0', meaning: 'yes, I spent it on what matters.' },
  { id: 'red', hex: '#C06A62', soft: '#D9A8A3', meaning: 'no, I wish I’d spent it differently.' },
  { id: 'grey', hex: '#8E8E87', soft: '#AEAEA6', meaning: 'I don’t know… I wasn’t paying attention.' },
]

/** Each colour's short label, wherever space is tight (the brand story's words). */
export const WORD: Record<Paint, string> = { green: 'worth it', red: 'regret', grey: 'a blur' }

/** After a number, in counts: "3 worth it", "2 regrets", "1 blur". */
export const counted = (p: Paint, n: number) =>
  `${n.toLocaleString('en-US')} ${p === 'green' ? 'worth it' : (p === 'red' ? 'regret' : 'blur') + (n === 1 ? '' : 's')}`

export const paintHex = (p: Paint) => PAINTS.find((x) => x.id === p)!.hex

/** A square in an overview: the soft shade, or the full paint for a framed day (it pops among the soft ones). */
export const squareFill = (p: Paint, framed?: boolean) => (framed ? paintHex(p) : PAINTS.find((x) => x.id === p)!.soft)

/** A deeper shade of a paint (its hue, mixed toward ink): the word written on its square, tone on tone. */
/** A framed day's frame: its paint, a third of the way toward ink (#53735C for green). */
export const FRAME = '#53735C'
const FRAMES: Record<Paint, string> = { green: FRAME, red: '#874D48', grey: '#656560' }
/** Any colour can be framed (a day you want to keep): the frame is that paint's own deeper shade. */
export const frameOf = (p: Paint) => FRAMES[p]
/** The CSS a framed thing reads its colours from: --paint (the day's paint) and --frame (its frame). */
export const frameVars = (p: Paint) => ({ '--paint': paintHex(p), '--frame': frameOf(p) }) as React.CSSProperties

export function paintDeep(p: Paint): string {
  const n = parseInt(paintHex(p).slice(1), 16)
  const ink = [20, 20, 19]
  const c = [n >> 16, (n >> 8) & 255, n & 255].map((v, i) => Math.round(v + (ink[i] - v) * 0.55))
  return `rgb(${c.join(', ')})`
}
