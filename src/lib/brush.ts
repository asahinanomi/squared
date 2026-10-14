// A dry-ish round brush: a solid core plus loose bristles. Stamping the same tip
// every couple of pixels makes each bristle trail a streak along the stroke,
// which reads like paint dragged across paper.

const STAMPS = new Map<string, HTMLCanvasElement>()

function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16)
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(c + amt * 255)))
  return `rgb(${f(n >> 16)}, ${f((n >> 8) & 255)}, ${f(n & 255)})`
}

// Deterministic pseudo-random so a color's tip looks the same every session.
function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
}

/** Brush tip for a color at a given pixel radius (cached). */
export function brushTip(hex: string, radius: number): HTMLCanvasElement {
  const key = `${hex}@${Math.round(radius)}`
  const hit = STAMPS.get(key)
  if (hit) return hit

  const size = Math.ceil(radius * 2 + 4)
  const c = document.createElement('canvas')
  c.width = c.height = size
  const g = c.getContext('2d')!
  const mid = size / 2
  const rand = rng(hex.length * 977 + parseInt(hex.slice(1), 16))

  // Core: soft-edged body of paint.
  const core = g.createRadialGradient(mid, mid, radius * 0.55, mid, mid, radius * 0.86)
  core.addColorStop(0, hex)
  core.addColorStop(1, hex + '00')
  g.fillStyle = core
  g.beginPath()
  g.arc(mid, mid, radius * 0.86, 0, Math.PI * 2)
  g.fill()

  // Bristles: small dots, denser toward the middle, some lighter/darker.
  for (let i = 0; i < 70; i++) {
    const a = rand() * Math.PI * 2
    const d = Math.sqrt(rand()) * radius * 0.94
    const r = radius * (0.04 + rand() * 0.07)
    g.globalAlpha = 0.35 + rand() * 0.55
    g.fillStyle = shade(hex, (rand() - 0.5) * 0.12)
    g.beginPath()
    g.arc(mid + Math.cos(a) * d, mid + Math.sin(a) * d, r, 0, Math.PI * 2)
    g.fill()
  }
  g.globalAlpha = 1

  STAMPS.set(key, c)
  return c
}
