import { supabase } from './supabase'

// The paintings you kept ("keep this painting"): they hang in my paintings. Saved with your account (so any device
// sees them) and on this device (so the demo, or a moment offline, still does).

const KEY = 'squared.keptPaintings'
const read = (): string[] => {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

/** Newest first: a month ("YYYY-MM") or a year ("YYYY"), each once. */
export function keptPaintings(fromAccount: unknown): string[] {
  const acc = Array.isArray(fromAccount) ? fromAccount.filter((p): p is string => typeof p === 'string') : []
  return [...new Set([...acc, ...read()])].sort().reverse()
}

export const keepPainting = (period: string, fromAccount: unknown) =>
  save([...keptPaintings(fromAccount).filter((p) => p !== period), period].sort().reverse())

/** Taken down from my paintings (it can always be kept again). */
export const unkeepPainting = (period: string, fromAccount: unknown) =>
  save(keptPaintings(fromAccount).filter((p) => p !== period))

async function save(next: string[]): Promise<string[]> {
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* the account still has it */
  }
  await supabase?.auth.updateUser({ data: { kept_paintings: next } }).catch(() => undefined)
  return next
}
