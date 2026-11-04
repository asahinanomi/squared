// How to paint, acted out once (nomi, Nov 4, 2026: a beta tester didn't know what to do; it replaced the ghost hint): the palette's own brush
// lifts out of its notch, dips into green (its head takes the colour), flies to the square, paints one soft stroke
// across it, and flies home; the stroke fades and the square is blank again. Painting is never done for you: the stroke
// is a ghost, never a colour. A copy of the brush flies, in a layer over the page, drawn in the palette's own units so
// it's the same brush; the real one waits, hidden, in its notch. Any touch ends it at once.

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

  // The stroke it paints: the square's old hint (two sweeps, each rising left to right), in its faint green.
  const sq = square.getBoundingClientRect()
  const pt = (x: number, y: number) => toUnits(sq.left + (sq.width * x) / 100, sq.top + (sq.height * y) / 100).join(' ')
  const trail = document.createElementNS(NS, 'path')
  trail.setAttribute('d', `M${pt(18, 46)} L${pt(82, 28)} L${pt(18, 68)} L${pt(82, 50)}`)
  Object.assign(trail.style, {
    fill: 'none',
    stroke: 'rgba(110, 155, 123, 0.2)',
    strokeWidth: String((sq.width * 0.09) / scale),
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  })
  trail.setAttribute('pathLength', '1')
  trail.style.strokeDasharray = '1'
  trail.style.strokeDashoffset = '1'
  layer.appendChild(trail)

  // The brush, copied, and its tip (where its hairs end), the point that travels.
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
  const head = copy.querySelector<SVGPathElement>('.brush-head')!.getBBox()
  const tip = [head.x + 2, head.y + head.height - 2]
  const wellAt = [Number(well.getAttribute('cx')), Number(well.getAttribute('cy'))]
  const total = trail.getTotalLength()
  const at = (len: number) => {
    const p = trail.getPointAtLength(len * total)
    return [p.x, p.y]
  }

  // The steps, in ms: to the green, a dip, to the square, the stroke (exactly the old hint's: 1.15s at an even pace,
  // fading from halfway, gone as it ends), home.
  const steps: [number, (k: number) => [number, number]][] = [
    [600, (k) => [lerp(tip[0], wellAt[0], ease(k)), lerp(tip[1], wellAt[1], ease(k))]],
    [450, (k) => [wellAt[0], wellAt[1] + Math.sin(k * Math.PI) * 5]],
    [700, (k) => [lerp(wellAt[0], at(0)[0], ease(k)), lerp(wellAt[1], at(0)[1], ease(k))] as [number, number]],
    [1150, (k) => at(k) as [number, number]],
    [700, (k) => [lerp(at(1)[0], tip[0], ease(k)), lerp(at(1)[1], tip[1], ease(k))]],
  ]
  const end = steps.reduce((s, [ms]) => s + ms, 0)
  const start = performance.now()
  let raf = 0
  let done = false
  const finish = () => {
    if (done) return
    done = true
    cancelAnimationFrame(raf)
    brush.style.visibility = ''
    layer.style.transition = 'opacity 0.5s'
    layer.style.opacity = '0'
    setTimeout(() => layer.remove(), 520)
    removeEventListener('pointerdown', finish, true)
  }
  const tick = (now: number) => {
    let t = now - start
    if (t >= end) {
      copy.setAttribute('transform', '')
      // Home: the real brush is back (the stroke faded as it ended).
      brush.style.visibility = ''
      copy.remove()
      finish()
      return
    }
    let i = 0
    while (t > steps[i][0]) t -= steps[i++][0]
    const k = t / steps[i][0]
    const [x, y] = steps[i][1](k)
    copy.setAttribute('transform', `translate(${x - tip[0]} ${y - tip[1]})`)
    if (i === 1 && k > 0.5 && !green.classList.contains('is-on')) {
      green.style.transition = '' // the head takes the green, softly
      green.classList.add('is-on')
    }
    if (i === 4) green.classList.remove('is-on') // the paint is on the square: it goes home clean
    if (i === 3) {
      trail.style.strokeDashoffset = String(1 - k)
      trail.style.opacity = String(k < 0.5 ? 1 : 1 - (k - 0.5) * 2)
    }
    if (i === 4) trail.style.opacity = '0'
    raf = requestAnimationFrame(tick)
  }
  raf = requestAnimationFrame(tick)
  addEventListener('pointerdown', finish, true)
  return finish
}
