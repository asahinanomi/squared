import { PAINTS } from './paints'

// How to paint, acted out once (lab, nomi, Nov 4, 2026: a beta tester didn't know what to do): the palette's own brush
// lifts out of its notch, dips into green (its head takes the colour), flies to the square, paints one soft stroke
// across it, and flies home; the stroke fades and the square is blank again. Painting is never done for you: the stroke
// is a ghost, never a colour. A copy of the brush flies, in a layer over the page, drawn in the palette's own units so
// it's the same brush; the real one waits, hidden, in its notch. Any touch ends it at once.

const GREEN = PAINTS.find((p) => p.id === 'green')!.hex

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

  // The stroke it paints: a soft wave across the middle of the square, a ghost of green.
  const sq = square.getBoundingClientRect()
  const [ax, ay] = toUnits(sq.left + sq.width * 0.2, sq.top + sq.height * 0.58)
  const [bx, by] = toUnits(sq.left + sq.width * 0.8, sq.top + sq.height * 0.42)
  const midY = (ay + by) / 2
  const trail = document.createElementNS(NS, 'path')
  trail.setAttribute(
    'd',
    `M${ax} ${ay} C${lerp(ax, bx, 0.33)} ${midY - 14} ${lerp(ax, bx, 0.66)} ${midY + 14} ${bx} ${by}`,
  )
  Object.assign(trail.style, {
    fill: 'none',
    stroke: GREEN,
    strokeWidth: String(18 / scale),
    strokeLinecap: 'round',
    opacity: '0.5',
  })
  trail.setAttribute('pathLength', '1')
  trail.style.strokeDasharray = '1'
  trail.style.strokeDashoffset = '1'
  layer.appendChild(trail)

  // The brush, copied, and its tip (where its hairs end), the point that travels.
  const copy = brush.cloneNode(true) as SVGGElement
  copy.querySelectorAll('.brush-load').forEach((p) => p.classList.remove('is-on'))
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

  // The steps, in ms: to the green, a dip, to the square, the stroke, home, then the stroke fades.
  const steps: [number, (k: number) => [number, number]][] = [
    [600, (k) => [lerp(tip[0], wellAt[0], ease(k)), lerp(tip[1], wellAt[1], ease(k))]],
    [450, (k) => [wellAt[0], wellAt[1] + Math.sin(k * Math.PI) * 5]],
    [700, (k) => [lerp(wellAt[0], at(0)[0], ease(k)), lerp(wellAt[1], at(0)[1], ease(k))] as [number, number]],
    [1300, (k) => at(ease(k)) as [number, number]],
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
      // Home: the real brush is back; the ghost stroke lingers a moment, then fades.
      brush.style.visibility = ''
      copy.remove()
      trail.style.transition = 'opacity 0.9s'
      trail.style.opacity = '0'
      setTimeout(finish, 900)
      return
    }
    let i = 0
    while (t > steps[i][0]) t -= steps[i++][0]
    const k = t / steps[i][0]
    const [x, y] = steps[i][1](k)
    copy.setAttribute('transform', `translate(${x - tip[0]} ${y - tip[1]})`)
    if (i === 1 && k > 0.5) copy.querySelector('.brush-load')?.classList.add('is-on') // the head takes the green
    if (i === 3) trail.style.strokeDashoffset = String(1 - ease(k))
    raf = requestAnimationFrame(tick)
  }
  raf = requestAnimationFrame(tick)
  addEventListener('pointerdown', finish, true)
  return finish
}
