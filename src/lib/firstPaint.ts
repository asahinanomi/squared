// How to paint, acted out (nomi, Nov 4, 2026: a beta tester didn't know what to do; it replaced the ghost hint), the
// way squared really works (nomi, Nov 5, 2026: a flying brush taught "carry the brush to the well", which isn't how it
// works): a pointing hand (its fingertip doing the work) taps the green well, the brush takes the green right where it rests, then
// the fingertip paints one soft stroke across the square; the stroke fades, the brush goes clean, the square is blank
// again. Painting is never done for you: the stroke is a ghost, never a colour. A copy of the brush, over the real one
// in its notch, takes the colour, in a layer over the page drawn in the palette's own units. Any touch ends it at once.

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

export function showFirstPaint(): () => void {
  const palette = document.querySelector<SVGSVGElement>('.today .palette')
  const brush = palette?.querySelector<SVGGElement>('.brush')
  const square = document.querySelector<HTMLElement>('.today .easel .canvas')
  const well = palette?.querySelector<SVGCircleElement>('.well[aria-label="green"] .well-hit')
  if (!palette || !brush || !square || !well) return () => undefined
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return () => undefined

  // A layer exactly over the palette, in its units (its viewBox), free to draw beyond it.
  const box = palette.getBoundingClientRect()
  const [vx, vy, vw] = palette.getAttribute('viewBox')!.split(' ').map(Number)
  const scale = box.width / vw
  const toUnits = (px: number, py: number) => [(px - box.left) / scale + vx, (py - box.top) / scale + vy]
  const NS = 'http://www.w3.org/2000/svg'
  const layer = document.createElementNS(NS, 'svg')
  layer.setAttribute('viewBox', palette.getAttribute('viewBox')!)
  layer.setAttribute('class', 'first-paint')
  layer.setAttribute('aria-hidden', 'true')
  Object.assign(layer.style, {
    left: `${box.left + scrollX}px`,
    top: `${box.top + scrollY}px`,
    width: `${box.width}px`,
    height: `${box.height}px`,
  })

  // The stroke it paints: as wide as the real brush (nomi, Nov 5, 2026: a thin line taught careful colouring in), a
  // few quick passes the way a finger really swipes (nomi, Nov 5, 2026): up to the upper right, straight back at an
  // angle, up again, turning sharply like a real back-and-forth (no step aside at the turns), so the paint grows steadily from the lower right corner to the upper
  // left (crossing corners read busy), painting most of the square (about 80%); it holds as the hand lifts, then fades. A faint green, kept inside the square's face, as real paint is.
  const sq = square.getBoundingClientRect()
  const pt = (x: number, y: number) => toUnits(sq.left + (sq.width * x) / 100, sq.top + (sq.height * y) / 100).join(' ')
  const trail = document.createElementNS(NS, 'path')
  trail.setAttribute('d', `M${pt(40, 90)} L${pt(88, 30)} L${pt(14, 72)} L${pt(66, 10)}`)
  Object.assign(trail.style, {
    fill: 'none',
    stroke: 'rgba(110, 155, 123, 0.3)',
    strokeWidth: String((sq.width * 0.58 * 0.86) / scale), // PaintCanvas's BRUSH, at its solid core
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  })
  trail.setAttribute('pathLength', '1')
  trail.style.strokeDasharray = '1'
  trail.style.strokeDashoffset = '1'
  // Unseen until the stroke begins: a round cap on an undrawn line still shows as a dot (nomi, Nov 4, 2026).
  trail.style.opacity = '0'
  const face = (square.querySelector('.canvas-face') ?? square).getBoundingClientRect()
  const [fx, fy] = toUnits(face.left, face.top)
  const clip = document.createElementNS(NS, 'clipPath')
  clip.id = 'first-paint-face'
  const faceRect = document.createElementNS(NS, 'rect')
  faceRect.setAttribute('x', String(fx))
  faceRect.setAttribute('y', String(fy))
  faceRect.setAttribute('width', String(face.width / scale))
  faceRect.setAttribute('height', String(face.height / scale))
  clip.appendChild(faceRect)
  layer.appendChild(clip)
  trail.setAttribute('clip-path', 'url(#first-paint-face)')
  layer.appendChild(trail)

  // The brush, copied over the real one: it stays put and takes the colour.
  const copy = brush.cloneNode(true) as SVGGElement
  // It starts clean, whatever the brush held (no fade from the last colour: nomi, Nov 4, 2026).
  copy.querySelectorAll<SVGPathElement>('.brush-load').forEach((p) => {
    p.style.transition = 'none'
    p.classList.remove('is-on')
  })
  const green = copy.querySelector<SVGPathElement>('.brush-load')! // the paints' order: green first
  layer.appendChild(copy)
  document.body.appendChild(layer)
  brush.style.visibility = 'hidden'
  // The fingertip, a touch wide. Its tap loads the real well, exactly as a real tap does (its splash
  // of drops at the edge and its swirl: nomi, Nov 5, 2026, never an effect of its own).
  const wellG = well.closest<SVGGElement>('.well')!
  const finger = (sq.width * 0.16) / scale / 2
  // A pointing hand in the palette's own ink keyline and white (lab B, nomi, Nov 5, 2026: a dot read as a bubble or a
  // drop), its fingertip at 0,0; turned to come from the lower right, and sized so its fingertip is a touch wide.
  const hand = document.createElementNS(NS, 'path')
  hand.setAttribute(
    'd',
    'M-7 30 L-7 7 A7 7 0 0 1 7 7 L7 26 C9 22 16 22 17 27 C19 23 26 24 26 29 C28 26 34 27 34 33 L34 46 C34 56 27 62 17 62 L5 62 C-3 62 -9 57 -12 50 L-20 37 C-23 32 -17 27 -12 31 L-7 36 Z M7 26 L7 34 M17 27 L17 34 M26 29 L26 35',
  )
  const handSize = finger / 16
  Object.assign(hand.style, {
    fill: '#fff',
    stroke: '#141413',
    strokeWidth: String(1.45 / scale / handSize),
    strokeLinejoin: 'round',
    strokeLinecap: 'round',
    filter: 'drop-shadow(0 3px 5px rgba(20, 20, 19, 0.18))',
    opacity: '0',
  })
  layer.appendChild(hand)
  const wellAt = [Number(well.getAttribute('cx')), Number(well.getAttribute('cy'))]
  const total = trail.getTotalLength()
  const at = (len: number) => {
    const p = trail.getPointAtLength(len * total)
    return [p.x, p.y]
  }

  // The steps, in ms, as where the fingertip is: it comes in to the green, taps, goes to the square, paints its
  // passes (1.5s at an even pace), and lifts away as the paint fades.
  const from = [wellAt[0] + finger * 4, wellAt[1] + finger * 5] // far enough to be seen arriving
  const steps: [number, (k: number) => [number, number]][] = [
    [600, (k) => [lerp(from[0], wellAt[0], ease(k)), lerp(from[1], wellAt[1], ease(k))]],
    [450, () => [wellAt[0], wellAt[1]]],
    [560, (k) => [lerp(wellAt[0], at(0)[0], ease(k)), lerp(wellAt[1], at(0)[1], ease(k))] as [number, number]],
    [1500, (k) => at(k) as [number, number]], // three passes, a little quicker than a calm hand
    [500, () => at(1) as [number, number]],
  ]
  const end = steps.reduce((s, [ms]) => s + ms, 0)
  // The clock starts on the first frame drawn, and stands still while the phone is busy (a stalled frame once jumped
  // it straight to the tap, so the brush went green before the hand was there: nomi, Nov 5, 2026).
  let start = 0
  let last = 0
  let raf = 0
  let done = false
  const finish = () => {
    if (done) return
    done = true
    cancelAnimationFrame(raf)
    brush.style.visibility = ''
    wellG.classList.remove('is-loaded')
    layer.style.transition = 'opacity 0.5s'
    layer.style.opacity = '0'
    setTimeout(() => layer.remove(), 520)
    removeEventListener('pointerdown', finish, true)
  }
  const tick = (now: number) => {
    if (!start) start = now
    if (last && now - last > 50) start += now - last - 16
    last = now
    let t = now - start
    if (t >= end) {
      // Done: the real brush is back, clean (the stroke faded as it ended).
      brush.style.visibility = ''
      copy.remove()
      finish()
      return
    }
    let i = 0
    while (t > steps[i][0]) t -= steps[i++][0]
    const k = t / steps[i][0]
    const [x, y] = steps[i][1](k)
    // In, fading; pressing a little for the tap; lifting away at the end.
    const press = i === 1 ? 1 - Math.sin(k * Math.PI) * 0.08 : 1
    hand.setAttribute('transform', `translate(${x} ${y}) rotate(-28) scale(${handSize * press})`)
    hand.style.opacity = String(i === 0 ? Math.min(1, k * 2.5) : i === 4 ? 1 - k : 1) // fully there before it taps
    if (i === 1 && k > 0.4 && !green.classList.contains('is-on')) {
      green.style.transition = '' // the tap: the brush takes the green, softly, where it rests
      green.classList.add('is-on')
      wellG.classList.add('is-loaded')
    }
    if (i === 4) {
      green.classList.remove('is-on') // the paint is on the square: the brush goes clean
      wellG.classList.remove('is-loaded')
    }
    if (i === 3) {
      trail.style.strokeDashoffset = String(1 - k)
      trail.style.opacity = '1'
    }
    if (i === 4) trail.style.opacity = String(1 - k) // the paint fades as the hand lifts
    raf = requestAnimationFrame(tick)
  }
  raf = requestAnimationFrame(tick)
  addEventListener('pointerdown', finish, true)
  return finish
}
