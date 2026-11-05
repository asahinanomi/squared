// A life's fill, one feel in every view (nomi, Nov 5, 2026): opening a life, or switching it between years, months and
// days (the capsule), the lived squares land from the top of the screen down to today in the days' own time (FILL_MS),
// each fading in over LAND_MS; then today pulses and "You are here." sits under it until you move.
export const FILL_MS = 3200
export const LAND_MS = 1200
export const calmMotion = () =>
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
