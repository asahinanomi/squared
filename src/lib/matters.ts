// "what matters": the owner's own compass — what a meaningful day and an empty day look like to them.
// A reference only: it never scores or colours a day. Kept on this device for now (syncs once accounts exist).

export type Entry = { id: string; text: string }
export type Matters = { meaningful: Entry[]; empty: Entry[] }
export type Kind = keyof Matters

const KEY = 'squared.matters'
export const MAX_CHARS = 120 // a line or two

export function loadMatters(): Matters {
  try {
    const m = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Matters | null
    if (m && Array.isArray(m.meaningful) && Array.isArray(m.empty)) return m
  } catch {
    /* unreadable or unavailable: start fresh */
  }
  return { meaningful: [], empty: [] }
}

export function saveMatters(m: Matters) {
  try {
    // Never keep blank entries.
    const clean = (l: Entry[]) => l.filter((e) => e.text.trim())
    localStorage.setItem(KEY, JSON.stringify({ meaningful: clean(m.meaningful), empty: clean(m.empty) }))
  } catch {
    /* storage unavailable (private mode): the lists last until the app closes */
  }
}

export const newEntry = (): Entry => ({ id: crypto.randomUUID(), text: '' })
