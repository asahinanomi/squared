import { supabase } from './supabase'

// The paintings you kept ("keep this painting"): they hang in my paintings. Saved with your account only (so every
// device sees the same wall); the demo, with no account, keeps them on the device.

const DEMO = 'squared.keptPaintings.demo'
const demoRead = (): string[] => {
  try {
    const v = JSON.parse(localStorage.getItem(DEMO) ?? '[]')
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

/** Newest first: a month ("YYYY-MM") or a year ("YYYY"), each once. */
export function keptPaintings(fromAccount: unknown): string[] {
  const list = supabase ? (Array.isArray(fromAccount) ? fromAccount : []) : demoRead()
  return [...new Set(list.filter((p): p is string => typeof p === 'string'))].sort().reverse()
}

/** Straight to the account; if it can't get there, it throws (and the wall stays as it was). */
export async function saveKept(next: string[]): Promise<string[]> {
  if (!supabase) {
    try {
      localStorage.setItem(DEMO, JSON.stringify(next))
    } catch {
      /* the demo lasts until the app closes */
    }
    return next
  }
  const { error } = await supabase.auth.updateUser({ data: { kept_paintings: next } })
  if (error) throw error
  return next
}
