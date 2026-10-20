import type { Paint } from './paints'

// Quiet sounds for painting, made in the browser (no audio files): a bristle-on-paper hiss that follows the
// brush, and one short tone when a square settles — warm for mattered, low for empty, a breath for slipped.
// Like a pencil on paper: never louder than that. Off with the "sound" switch in settings. (On iPhone, the
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

/** A soft bell-like note: a sine and a quieter octave, quick in, slow out (`octave`: how much octave it carries). */
function note(a: AudioContext, freq: number, at: number, level: number, length: number, octave = 0.18) {
  for (const [mult, share] of [
    [1, 1],
    [2, octave],
  ]) {
    const osc = a.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = freq * mult
    const g = a.createGain()
    g.gain.setValueAtTime(0, at)
    g.gain.linearRampToValueAtTime(level * share, at + 0.012)
    g.gain.exponentialRampToValueAtTime(0.0001, at + length)
    osc.connect(g).connect(master!)
    osc.start(at)
    osc.stop(at + length + 0.05)
  }
}

/** The square settles: one short tone, its own for each colour. */
export function settleSound(paint: Paint) {
  const a = audio()
  if (!a || !master) return
  const now = a.currentTime + 0.02
  if (paint === 'green') {
    // Mattered: warm and bright — two notes a sixth apart, the second just after.
    note(a, 523.25, now, 0.5, 0.9)
    note(a, 880, now + 0.09, 0.4, 1.1)
  } else if (paint === 'red') {
    // Empty: a falling minor third, slow and soft — a small sigh down. Pitched high enough for a phone's
    // speaker, with more octave in it, so it's as loud as mattered.
    note(a, 349.23, now, 0.5, 0.7, 0.45)
    note(a, 293.66, now + 0.22, 0.52, 1.1, 0.45)
  } else {
    // Slipped: sand running out — a trickle of tiny grains that thins away, like an hourglass emptying.
    const src = a.createBufferSource()
    src.buffer = sand(a)
    const filter = a.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.value = 1200
    const g = a.createGain()
    g.gain.value = 0.9
    src.connect(filter).connect(g).connect(master)
    src.start(now)
  }
}

let grains: AudioBuffer | null = null
/** About a second of falling sand: many tiny clicks of noise, thick at first, then thinning out. */
function sand(a: AudioContext): AudioBuffer {
  if (grains) return grains
  const rate = a.sampleRate
  grains = a.createBuffer(1, Math.round(rate * 1.1), rate)
  const data = grains.getChannelData(0)
  for (let n = 0; n < 260; n++) {
    // Grains bunch at the start and thin out toward the end (t² spacing).
    const t = Math.random() ** 2 * 1.0
    const at = Math.round(t * rate)
    const length = Math.round(rate * (0.002 + Math.random() * 0.004))
    const level = (0.25 + Math.random() * 0.75) * (1 - t * 0.85)
    for (let i = 0; i < length && at + i < data.length; i++) {
      const env = Math.sin((Math.PI * i) / length) // each grain a soft tick, not a click
      data[at + i] += (Math.random() * 2 - 1) * env * level
    }
  }
  return grains
}
