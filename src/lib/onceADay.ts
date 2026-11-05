import { addDays, todayIso } from './dates'

// "A day passes" moments (the life bar on my days, the date turning over on today) play once a day for each person on
// a device, the first time they're seen that day: signing out and in doesn't replay them; someone else signing in still
// sees theirs. Never with "reduce motion" (nomi, Oct 31 – Nov 2, 2026).
let who = 'demo'
/** Whose day it is: the signed-in person. */
export const onceADayFor = (id: string | undefined) => void (who = id ?? 'demo')

/** True the first time `what` is asked for today (and remembers it). */
export function onceToday(what: string): boolean {
  if (typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  const key = `squared.${what}.${who}`
  try {
    if (localStorage.getItem(key) === todayIso()) return false
    localStorage.setItem(key, todayIso())
  } catch {
    return false // no storage: never replay it on every visit
  }
  return true
}

/** Whether something has been done once, ever, by this person on this device (a hint that stops once it's used). */
export function doneOnce(what: string): boolean {
  try {
    return !!localStorage.getItem(`squared.${what}.${who}`)
  } catch {
    return false
  }
}
export function markDone(what: string) {
  try {
    localStorage.setItem(`squared.${what}.${who}`, '1')
  } catch {
    /* it may hint again */
  }
}

/** Count something up for this person on this device; returns the new count. */
export function countUp(what: string): number {
  try {
    const key = `squared.${what}.${who}`
    const n = Number(localStorage.getItem(key) ?? 0) + 1
    localStorage.setItem(key, String(n))
    return n
  } catch {
    return 0
  }
}

// Taught twice (nomi, Nov 5, 2026): a hint stops once it's been done on two different days. After the first, it rests
// a week; if it hasn't been done again on its own by then, the hint comes back until it is. Spaced, so it sticks.
const REST_DAYS = 7
function learning(what: string): { n: number; last?: string } {
  try {
    return JSON.parse(localStorage.getItem(`squared.${what}.${who}`) ?? '') ?? { n: 0 }
  } catch {
    return { n: 0 }
  }
}
/** Whether a taught-twice hint should show now. */
export function hintDue(what: string): boolean {
  const { n, last } = learning(what)
  if (n >= 2) return false
  return n === 0 || !last || addDays(last, REST_DAYS) <= todayIso()
}
/** It was done: counts once per day. */
export function didIt(what: string) {
  const { n, last } = learning(what)
  if (last === todayIso()) return
  try {
    localStorage.setItem(`squared.${what}.${who}`, JSON.stringify({ n: n + 1, last: todayIso() }))
  } catch {
    /* it may hint again */
  }
}
