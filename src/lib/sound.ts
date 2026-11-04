import type { Paint } from './paints'

// Quiet sounds for painting, made in the browser (no audio files): a bristle-on-paper hiss that follows the
// brush, and a small sound when a square settles — a drop for worth it, a pebble in a well for regret, sand
// for a blur. Like a pencil on paper: never louder than that. Off with the "sound" switch in settings. (On iPhone, the
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

// The settle sounds act out the answer: worth it is a water drop and a kalimba sparkle (a day that filled
// up), regret a pebble in an empty well (only its echo comes back), a blur sand running through your fingers. Chosen by ear in the sound lab; its levels were heard at 0.3, so they're
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

/** A pebble dropped into an empty well: a dull tap far below, then its echo coming back, two or three times, fainter
 * each time. Only the echo answers: where did the day go? (nomi, Nov 3, 2026: the knock was the weakest, too low for a
 * phone and stopping dead; "3c" in the sound lab.) */
function well(a: AudioContext, out: AudioNode, at: number) {
  const delay = a.createDelay(1)
  delay.delayTime.value = 0.28
  const fade = a.createGain()
  fade.gain.value = 0.2
  const lp = a.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 900
  delay.connect(lp).connect(fade).connect(delay)
  lp.connect(out)
  const o = a.createOscillator()
  const g = a.createGain()
  // Louder, and its fall a touch higher (nomi, Nov 4, 2026: it was much quieter than the drop and the sand on a phone,
  // whose speaker barely plays below 200Hz).
  o.frequency.setValueAtTime(420, at)
  o.frequency.exponentialRampToValueAtTime(190, at + 0.12)
  g.gain.setValueAtTime(0, at)
  g.gain.linearRampToValueAtTime(1.5, at + 0.005)
  g.gain.exponentialRampToValueAtTime(0.0001, at + 0.2)
  o.connect(g)
  g.connect(out)
  g.connect(delay)
  o.start(at)
  o.stop(at + 0.25)
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

/** Sand pours through, then is gone: only a faint soft puff where it lands. (Nov 3, 2026, nomi: a touch quieter, it
 * was the loudest on a phone, and no low drum at the end.) */
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
  g.gain.value = 0.2
  src.connect(hp).connect(lp).connect(g).connect(out)
  src.start(at)
  const end = at + seconds - 0.02
  const puff = a.createBufferSource()
  puff.buffer = white(a, 0.25)
  const plp = a.createBiquadFilter()
  plp.type = 'lowpass'
  plp.frequency.value = 900
  const pg = a.createGain()
  pg.gain.setValueAtTime(0.0001, end)
  pg.gain.linearRampToValueAtTime(0.18, end + 0.02)
  pg.gain.exponentialRampToValueAtTime(0.0001, end + 0.2)
  puff.connect(plp).connect(pg).connect(out)
  puff.start(end)
  puff.stop(end + 0.25)
}

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

/** A day framed: a little magic, three kalimba notes rising, then a soft shimmer of high bells. */
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

/** A day out of my hands: a wave far off, coming in and going out on its own. No notes, nothing to celebrate:
 * soft air that rises and falls, like a tide you can't hold (chosen by ear in the sound lab, "4c"). */
export function handsSound() {
  const a = audio()
  if (!a || !master) return
  const at = a.currentTime + 0.03
  const dur = 2
  const src = a.createBufferSource()
  src.buffer = white(a, dur + 0.1)
  const bp = a.createBiquadFilter()
  bp.type = 'bandpass'
  bp.Q.value = 0.7
  bp.frequency.setValueAtTime(380, at)
  bp.frequency.linearRampToValueAtTime(620, at + dur * 0.5)
  bp.frequency.linearRampToValueAtTime(420, at + dur)
  const g = a.createGain()
  g.gain.setValueAtTime(0.0001, at)
  g.gain.linearRampToValueAtTime(0.35 * SETTLE, at + dur * 0.45)
  g.gain.linearRampToValueAtTime(0.0001, at + dur)
  src.connect(bp).connect(g).connect(master)
  src.start(at)
  src.stop(at + dur + 0.1)
}

/** The square settles: its colour's sound: a drop, a well, or sand. */
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
  } else if (paint === 'red') well(a, out, t)
  else sand(a, out, t)
}
