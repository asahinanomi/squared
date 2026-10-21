import { fromIso, monthCells } from './dates'
import type { Days } from './days'
import { PAINTS, squareFill } from './paints'

// A finished month, as a painting: its days as a mosaic on squared's canvas, signed. The same picture is drawn
// on screen (as squares) and into an image to keep (here).

export const monthName = (month: string) => fromIso(`${month}-01`).toLocaleDateString('en-US', { month: 'long' })
export const shortMonth = (month: string) =>
  fromIso(`${month}-01`).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

/** One cell of the mosaic: a painted day's fill (and whether it's framed), a blank lived day, or no day (the lead). */
export type Cell = { fill: string; framed?: boolean } | 'blank' | null
export const RAW = '#ebe6da'
export const CANVAS = '#f7f5ef'
export const BLANK = '#efebe1'

export function cells(month: string, days: Days): Cell[] {
  return monthCells(`${month}-01`).map((iso) => {
    if (!iso) return null
    const d = days[iso]
    return d ? { fill: squareFill(d.color, d.framed), framed: d.framed && d.color === 'green' } : 'blank'
  })
}

export function counts(month: string, days: Days) {
  return PAINTS.map((p) => ({
    id: p.id,
    hex: p.hex,
    n: Object.entries(days).filter(([iso, d]) => iso.startsWith(month) && d.color === p.id).length,
  }))
}

/** The painting as an image (1080×1350): the title, the signed canvas, and the month's counts. */
export async function paintingImage(month: string, days: Days, name: string): Promise<Blob> {
  await document.fonts.load('600 80px Caveat').catch(() => undefined)
  const W = 1080
  const H = 1350
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#fafaf8'
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = '#dddcd6'
  for (let y = 24; y < H; y += 48) for (let x = 24; x < W; x += 48) ctx.fillRect(x - 2, y - 2, 4, 4)

  // Everything, centred on the page: the title, the canvas, the counts.
  const list = cells(month, days)
  const rows = Math.ceil(list.length / 7)
  const size = 128
  const pad = 30
  const foot = 96
  const gw = size * 7
  const gh = size * rows
  const aw = gw + pad * 2
  const ah = gh + pad + foot
  const block = 130 + 60 + ah + 120
  const top = (H - block) / 2
  const ax = (W - aw) / 2
  const ay = top + 190

  ctx.fillStyle = '#141413'
  ctx.textAlign = 'center'
  ctx.save()
  ctx.translate(W / 2, top + 100)
  ctx.rotate((-3 * Math.PI) / 180)
  ctx.font = '600 104px Caveat, cursive'
  ctx.fillText(`${monthName(month)}, painted`, 0, 0)
  ctx.restore()

  // The canvas: ink edge, raw margin (deeper at the foot, for the signature), then the mosaic.
  ctx.fillStyle = 'rgba(20,20,19,0.12)'
  ctx.fillRect(ax + 6, ay + 18, aw, ah)
  ctx.fillStyle = RAW
  ctx.fillRect(ax, ay, aw, ah)
  ctx.fillStyle = CANVAS
  ctx.fillRect(ax + pad, ay + pad, gw, gh)
  list.forEach((cell, i) => {
    if (!cell) return
    const x = ax + pad + (i % 7) * size
    const y = ay + pad + Math.floor(i / 7) * size
    ctx.fillStyle = cell === 'blank' ? BLANK : cell.fill
    ctx.fillRect(x, y, size, size)
    if (cell !== 'blank' && cell.framed) {
      ctx.lineWidth = 9
      ctx.strokeStyle = '#53735c'
      ctx.strokeRect(x + 10, y + 10, size - 20, size - 20)
      ctx.lineWidth = 5
      ctx.strokeStyle = RAW
      ctx.strokeRect(x + 17, y + 17, size - 34, size - 34)
    }
  })
  ctx.lineWidth = 7
  ctx.strokeStyle = '#141413'
  ctx.strokeRect(ax, ay, aw, ah)

  // Signed in the margin, lower right.
  ctx.save()
  ctx.translate(ax + aw - pad, ay + ah - 30)
  ctx.rotate((-4 * Math.PI) / 180)
  ctx.textAlign = 'right'
  ctx.fillStyle = 'rgba(20,20,19,0.6)'
  ctx.font = '600 58px Caveat, cursive'
  ctx.fillText([name, shortMonth(month)].filter(Boolean).join(' · '), 0, 0)
  ctx.restore()

  ctx.textAlign = 'center'
  ctx.font = '500 34px Inter, system-ui, sans-serif'
  ctx.fillStyle = '#3d3d3a'
  const line = counts(month, days)
    .map((p) => `${p.n} ${p.id === 'green' ? 'mattered' : p.id === 'red' ? 'empty' : 'slipped'}`)
    .join('  ·  ')
  ctx.fillText(line, W / 2, ay + ah + 100)
  ctx.font = '500 28px Inter, system-ui, sans-serif'
  ctx.fillStyle = '#8f8f8a'
  ctx.fillText('squared.today', W / 2, H - 60)
  return new Promise((ok) => c.toBlob((b) => ok(b!), 'image/png'))
}
