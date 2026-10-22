import type { Paint } from './paints'

// Quiet sounds for painting, made in the browser (no audio files): a bristle-on-paper hiss that follows the
// brush, and a small sound when a square settles — a drop for mattered, a hollow knock for empty, sand for
// slipped. Like a pencil on paper: never louder than that. Off with the "sound" switch in settings. (On iPhone, the
// silent switch silences it too.)

const KEY = 'squared.sound'
const VOLUME = 0.22

export function soundOn(): boolean {
  try {
    return localStorage.getItem(KEY) !== 'off'
  } catch {
    return true
  }
}

export function setSoundOn(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off')
  } catch {
    /* private mode: it stays on for this visit */
  }
}

let ctx: AudioContext | null = null
let master: GainNode | null = null
let noise: AudioBuffer | null = null

/** The audio context, made (or woken) inside a touch — browsers only allow sound after one. */
function audio(): AudioContext | null {
  if (!soundOn()) return null
  try {
    if (!ctx) {
      ctx = new AudioContext()
      master = ctx.createGain()
      master.gain.value = VOLUME
      master.connect(ctx.destination)
      // One second of soft noise, looped: the bristles.
      noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
      const data = noise.getChannelData(0)
      let last = 0
      for (let i = 0; i < data.length; i++) {
        last = 0.97 * last + 0.03 * (Math.random() * 2 - 1) // brown-ish: soft, not hissy
        data[i] = last * 6
      }
    }
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

/** Wake the sound on the first touch of a stroke (iPhone needs it inside the touch). */
export function wakeSound() {
  audio()
}

let brush: { src: AudioBufferSourceNode; gain: GainNode; filter: BiquadFilterNode } | null = null

/** The brush on paper: louder and brighter the faster it moves (speed in squares per second). */
export function brushSound(speed: number) {
  const a = audio()
  if (!a || !master || !noise) return
  if (!brush) {
    const src = a.createBufferSource()
    src.buffer = noise
    src.loop = true
    const filter = a.createBiquadFilter()
    filter.type = 'bandpass'
    filter.Q.value = 0.8
    const gain = a.createGain()
    gain.gain.value = 0
    src.connect(filter).connect(gain).connect(master)
    src.start()
    brush = { src, gain, filter }
  }
  const s = Math.min(1, speed / 4)
  const now = a.currentTime
  brush.gain.gain.setTargetAtTime(0.15 + 0.55 * s, now, 0.03)
  brush.filter.frequency.setTargetAtTime(700 + 1500 * s, now, 0.05)
}

/** The brush lifts: the hiss fades out. */
export function brushStop() {
  if (!ctx || !brush) return
  const b = brush
  brush = null
  b.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.04)
  b.src.stop(ctx.currentTime + 0.3)
}

// The settle sounds act out the answer: mattered is a water drop and a kalimba sparkle (a day that filled
// up), empty a knock on an empty wooden box ("tok-tok", nothing inside), slipped sand running through and
// landing softly on the floor. Chosen by ear in the sound lab; its levels were heard at 0.3, so they're
// lifted by that much over the brush's master volume.
const SETTLE = 0.3 / VOLUME

function white(a: AudioContext, seconds: number) {
  const b = a.createBuffer(1, Math.round(a.sampleRate * seconds), a.sampleRate)
  const d = b.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  return b
}

/** A water drop: a sine that sweeps up fast and dies fast — the "plip". */
function drop(a: AudioContext, out: AudioNode, at: number) {
  const o = a.createOscillator()
  const g = a.createGain()
  o.frequency.setValueAtTime(520, at)
  o.frequency.exponentialRampToValueAtTime(1500, at + 0.045)
  g.gain.setValueAtTime(0, at)
  g.gain.linearRampToValueAtTime(0.9, at + 0.004)
  g.gain.exponentialRampToValueAtTime(0.0001, at + 0.13)
  o.connect(g).connect(out)
  o.start(at)
  o.stop(at + 0.15)
}

/** A kalimba pluck: a sine with a faint high partial and a tiny tine click, ringing out. */
function kalimba(a: AudioContext, out: AudioNode, at: number, f: number, level: number) {
  for (const [mult, share, length] of [
    [1, 1, 1.1],
    [5.9, 0.12, 0.12],
    [3, 0.05, 0.3],
  ]) {
    const o = a.createOscillator()
    const g = a.createGain()
    o.frequency.value = f * mult
    g.gain.setValueAtTime(0, at)
    g.gain.linearRampToValueAtTime(level * share, at + 0.003)
    g.gain.exponentialRampToValueAtTime(0.0001, at + length)
    o.connect(g).connect(out)
    o.start(at)
    o.stop(at + length + 0.05)
  }
}

/** A knock on a hollow wooden box: a tiny click through three woody resonances, plus a short low thump. */
function knock(a: AudioContext, out: AudioNode, at: number, pitch: number, level: number) {
  const src = a.createBufferSource()
  src.buffer = white(a, 0.03)
  const env = a.createGain()
  env.gain.setValueAtTime(level, at)
  env.gain.exponentialRampToValueAtTime(0.0001, at + 0.025)
  src.connect(env)
  for (const [f, q, share] of [
    [230, 14, 1.4],
    [520, 18, 0.7],
    [1150, 10, 0.25],
  ]) {
    const bp = a.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = f * pitch
    bp.Q.value = q
    const g = a.createGain()
    g.gain.value = share * 3
    env.connect(bp).connect(g).connect(out)
  }
  const o = a.createOscillator()
  const g = a.createGain()
  o.frequency.setValueAtTime(190 * pitch, at)
  o.frequency.exponentialRampToValueAtTime(140 * pitch, at + 0.09)
  g.gain.setValueAtTime(0, at)
  g.gain.linearRampToValueAtTime(0.5 * level, at + 0.004)
  g.gain.exponentialRampToValueAtTime(0.0001, at + 0.12)
  o.connect(g).connect(out)
  o.start(at)
  o.stop(at + 0.14)
  src.start(at)
  src.stop(at + 0.03)
}

let pour: AudioBuffer | null = null
/** Sand running through: hundreds of tiny soft grains under a swell — in, full, out. */
function sandPour(a: AudioContext, seconds: number) {
  if (pour) return pour
  const rate = a.sampleRate
  pour = a.createBuffer(1, Math.round(rate * (seconds + 0.05)), rate)
  const d = pour.getChannelData(0)
  for (let n = 0; n < 900; n++) {
    const t = Math.random() * seconds
    const swell = Math.sin(Math.PI * Math.min(1, t / seconds)) ** 0.6
    const start = Math.round(t * rate)
    const length = Math.round(rate * (0.005 + Math.random() * 0.008))
    const level = (0.3 + Math.random() * 0.7) * swell
    for (let i = 0; i < length && start + i < d.length; i++)
      d[start + i] += (Math.random() * 2 - 1) * Math.sin((Math.PI * i) / length) * level
  }
  return pour
}

/** Sand pours, then lands: a soft, low puff as it settles on the floor. */
function sand(a: AudioContext, out: AudioNode, at: number) {
  const seconds = 0.65
  const src = a.createBufferSource()
  src.buffer = sandPour(a, seconds)
  const hp = a.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 300
  const lp = a.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 1700 // rounded off: sand, not sizzle
  const g = a.createGain()
  g.gain.value = 0.28
  src.connect(hp).connect(lp).connect(g).connect(out)
  src.start(at)
  const end = at + seconds - 0.02
  const o = a.createOscillator()
  const og = a.createGain()
  o.frequency.setValueAtTime(110, end)
  o.frequency.exponentialRampToValueAtTime(70, end + 0.18)
  og.gain.setValueAtTime(0, end)
  og.gain.linearRampToValueAtTime(0.45, end + 0.012)
  og.gain.exponentialRampToValueAtTime(0.0001, end + 0.22)
  o.connect(og).connect(out)
  o.start(end)
  o.stop(end + 0.25)
  const puff = a.createBufferSource()
  puff.buffer = white(a, 0.25)
  const plp = a.createBiquadFilter()
  plp.type = 'lowpass'
  plp.frequency.value = 900
  const pg = a.createGain()
  pg.gain.setValueAtTime(0.0001, end)
  pg.gain.linearRampToValueAtTime(0.35, end + 0.015)
  pg.gain.exponentialRampToValueAtTime(0.0001, end + 0.2)
  puff.connect(plp).connect(pg).connect(out)
  puff.start(end)
  puff.stop(end + 0.25)
}

/** A day framed: a little magic — three kalimba notes rising, then a soft shimmer of high bells. */
/** Sound turned on: two soft rising plucks, so you hear that it's back. */
export function soundOnChime() {
  const a = audio()
  if (!a || !master) return
  const out = a.createGain()
  out.gain.value = SETTLE
  out.connect(master)
  const t = a.currentTime + 0.03
  kalimba(a, out, t, 1046.5, 0.3)
  kalimba(a, out, t + 0.1, 1568, 0.26)
}

export function frameSound() {
  const a = audio()
  if (!a || !master) return
  const out = a.createGain()
  out.gain.value = SETTLE
  out.connect(master)
  const t = a.currentTime + 0.03
  ;[1046.5, 1318.5, 1568].forEach((f, i) => kalimba(a, out, t + i * 0.11, f, 0.34))
  for (let i = 0; i < 7; i++) kalimba(a, out, t + 0.36 + i * 0.045, 2093 * (1 + (i % 3) * 0.25), 0.07)
}

/** The square settles: its colour's sound — a drop, a knock, or sand. */
export function settleSound(paint: Paint) {
  const a = audio()
  if (!a || !master) return
  const out = a.createGain()
  out.gain.value = SETTLE
  out.connect(master)
  const t = a.currentTime + 0.03
  if (paint === 'green') {
    drop(a, out, t)
    kalimba(a, out, t + 0.14, 1318.5, 0.42)
  } else if (paint === 'red') {
    knock(a, out, t, 1, 2.2)
    knock(a, out, t + 0.16, 0.92, 1.9)
  } else sand(a, out, t)
}
