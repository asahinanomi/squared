// Switching a life between years, months and days (the capsule): the new view pours in quickly (about a second),
// the same wave as a life opening, as the transition itself (nomi, Nov 5, 2026). Opening a life keeps its full fill.
let switchedAt = -1e9
/** The capsule was just used. */
export const markSwitch = () => void (switchedAt = performance.now())
/** This view opened from the capsule, a moment ago (so its fill is the quick one). */
export const justSwitched = () => performance.now() - switchedAt < 1500
/** The quick fill's length, ms. */
export const QUICK_FILL = 1000
export const calmMotion = () =>
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
