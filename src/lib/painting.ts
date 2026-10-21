import { fromIso, isoDate, monthCells, todayIso } from './dates'
import type { Days } from './days'
import { FRAME, PAINTS } from './paints'

// A finished month, as a painting: each day a soft pool of its paint where it falls in the month, the brush's
// bristles as round drops on top, unpainted days in the raw canvas's linen. Framed in flat grey with a thin mat,
// signed in the hand. The random numbers come from the month itself: same month, same painting, every time.
// The sheet shows it and the picture you keep is it, exactly.

// A painting is of a month ("YYYY-MM") or, the same way, a whole year ("YYYY").
const isYear = (p: string) => p.length === 4
export const monthName = (p: string) =>
  isYear(p) ? p : fromIso(`${p}-01`).toLocaleDateString('en-US', { month: 'long' })
/** A month (or year) still being painted: shown "so far", and not signed until it ends. */
export const inProgress = (p: string) => p >= todayIso().slice(0, p.length)
export const shortMonth = (p: string) =>
  isYear(p) ? p : fromIso(`${p}-01`).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

type Rgb = [number, number, number]
const RAW: Rgb = [227, 220, 203]
const hexRgb = (h: string): Rgb => {
  const n = parseInt(h.slice(1), 16)
  return [n >> 16, (n >> 8) & 255, n & 255]
}
const tone = (c: Rgb, k: number) => c.map((v) => Math.max(0, Math.min(255, Math.round(v + k * 255)))) as Rgb
const rgba = (c: Rgb, a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`

function seeded(str: string) {
  let h = 1779033703
  for (const ch of str) {
    h = Math.imul(h ^ ch.charCodeAt(0), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    h ^= h >>> 16
    return (h >>> 0) / 4294967296
  }
}

function soft(ctx: CanvasRenderingContext2D, x: number, y: number, rad: number, c: Rgb, a: number, hold: number) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, rad)
  g.addColorStop(0, rgba(c, a))
  g.addColorStop(hold, rgba(c, a))
  g.addColorStop(1, rgba(c, 0))
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(x, y, rad, 0, Math.PI * 2)
  ctx.fill()
}

/** Every day of a year, Jan 1 to Dec 31. */
function yearDays(y: string) {
  const out: string[] = []
  for (let d = new Date(Number(y), 0, 1); d.getFullYear() === Number(y); d.setDate(d.getDate() + 1))
    out.push(isoDate(d))
  return out
}

/** The paint, day by day: a colour per lived day (null before the 1st), framed green deeper. */
function colours(month: string, days: Days): (Rgb | null)[] {
  return (isYear(month) ? yearDays(month) : monthCells(`${month}-01`)).map((iso) => {
    if (!iso || iso > todayIso()) return null // before the 1st, or not lived yet (this month, so far)
    const d = days[iso]
    if (!d) return RAW
    return hexRgb(d.framed && d.color === 'green' ? FRAME : PAINTS.find((p) => p.id === d.color)!.hex)
  })
}

/** Draws the framed, signed painting into a square canvas of `px` pixels. */
export async function drawPainting(c: HTMLCanvasElement, month: string, days: Days, name: string, px: number) {
  await document.fonts.load('600 40px Caveat').catch(() => undefined)
  c.width = c.height = px
  const ctx = c.getContext('2d')!
  const list = colours(month, days)
  const r = seeded(month + list.map((c) => (c ? c.join('.') : '-')).join(','))
  const gauss = () => Math.sqrt(-2 * Math.log(r() + 1e-9)) * Math.cos(2 * Math.PI * r())

  // The frame (flat warm grey), the thin mat, then the painting inside.
  const f = Math.round(px * 0.055)
  const x = f + Math.round(px * 0.03)
  const s = px - 2 * x
  ctx.fillStyle = '#9c9a93'
  ctx.fillRect(0, 0, px, px)
  ctx.fillStyle = '#f6f3ec'
  ctx.fillRect(f, f, px - 2 * f, px - 2 * f)

  ctx.save()
  ctx.beginPath()
  ctx.rect(x, x, s, s)
  ctx.clip()
  ctx.fillStyle = rgba(RAW, 1)
  ctx.fillRect(x, x, s, s)
  const cols = isYear(month) ? 19 : 7 // a month in its calendar; a year's days in rows, nearly square
  const rows = Math.ceil(list.length / cols)
  const cw = s / cols
  const ch = s / rows
  const u = Math.max(cw, ch)
  const at = list.flatMap((c, k) =>
    c
      ? [
          {
            c,
            x: x + ((k % cols) + 0.5) * cw + gauss() * cw * 0.25,
            y: x + (Math.floor(k / cols) + 0.5) * ch + gauss() * ch * 0.25,
          },
        ]
      : [],
  )
  for (const p of at)
    for (let i = 0; i < 7; i++)
      soft(ctx, p.x + gauss() * u * 0.12, p.y + gauss() * u * 0.12, u * (0.85 + r() * 0.25), p.c, 0.5, 0.6)
  for (const p of at)
    for (let i = 0; i < 11; i++) {
      const a = r() * Math.PI * 2
      const d = Math.sqrt(r()) * u * 1.05
      const rad = u * (0.06 + r() ** 1.4 * 0.16)
      soft(
        ctx,
        p.x + Math.cos(a) * d,
        p.y + Math.sin(a) * d,
        rad,
        tone(p.c, (r() - 0.35) * 0.16),
        0.35 + r() * 0.4,
        0.86,
      )
    }
  // A fine grain, like canvas (too fine to see on a thumbnail).
  if (px < 200) {
    ctx.restore()
    frameLines(ctx, px, f, x, s)
    return
  }
  const im = ctx.getImageData(x, x, s, s)
  const d = im.data
  for (let i = 0; i < d.length; i += 4) {
    const n = (r() - 0.5) * 10
    d[i] += n
    d[i + 1] += n
    d[i + 2] += n
  }
  ctx.putImageData(im, x, x)
  ctx.restore()

  frameLines(ctx, px, f, x, s)

  // Signed in the hand, low in the lower right, once the month is done: the title, and the painter under it.
  if (inProgress(month)) return
  ctx.save()
  ctx.translate(x + s * 0.93, x + s * 0.95)
  ctx.rotate((-4 * Math.PI) / 180)
  ctx.textAlign = 'right'
  ctx.fillStyle = 'rgba(20,20,19,0.6)'
  ctx.font = `600 ${Math.round(s * 0.058)}px Caveat, cursive`
  ctx.fillText(shortMonth(month), 0, name ? -s * 0.045 : 0)
  if (name) {
    ctx.font = `600 ${Math.round(s * 0.04)}px Caveat, cursive`
    ctx.fillText(name, 0, 0)
  }
  ctx.restore()
}

function frameLines(ctx: CanvasRenderingContext2D, px: number, f: number, x: number, s: number) {
  ctx.strokeStyle = 'rgba(20,20,19,0.22)'
  ctx.lineWidth = Math.max(1, px / 540)
  ctx.strokeRect(f + 1, f + 1, px - 2 * f - 2, px - 2 * f - 2)
  ctx.strokeRect(x - 1, x - 1, s + 2, s + 2)
}

/** The painting as a picture to keep: exactly what's in the frame, 1080×1080. */
export async function paintingImage(month: string, days: Days, name: string): Promise<Blob> {
  const c = document.createElement('canvas')
  await drawPainting(c, month, days, name, 1080)
  return new Promise((ok) => c.toBlob((b) => ok(b!), 'image/png'))
}
