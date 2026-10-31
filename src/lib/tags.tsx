import type { ReactNode } from 'react'
import type { Notes } from './notes'

// Tags (nomi, Oct 31, 2026): a #word written in a moment ("#travel", "#sick") is a tag. Nothing to add or manage:
// squared reads the # you already write, collects every one you've used, and the list can show the days that carry
// one. Letters, numbers, - and _ make the word; matched without case ("#Travel" is "#travel").
const TAG = /#([\p{L}\p{N}_-]+)/gu

/** The tags in a moment's words, lowercased, each once. */
export function tagsIn(text: string): string[] {
  return [...new Set([...text.matchAll(TAG)].map((m) => m[1].toLowerCase()))]
}

/** Every tag you've used, the most used first (then a to z). */
export function allTags(notes: Notes): string[] {
  const count = new Map<string, number>()
  for (const list of Object.values(notes))
    for (const n of list) for (const t of tagsIn(n.body)) count.set(t, (count.get(t) ?? 0) + 1)
  return [...count].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([t]) => t)
}

/** Whether a day's moments carry a tag. */
export const dayHasTag = (notes: Notes, iso: string, tag: string) =>
  (notes[iso] ?? []).some((n) => tagsIn(n.body).includes(tag))

/** A moment's words with its tags set quietly apart, so they read as tags, not shouting. */
export function withTags(text: string): ReactNode[] {
  const out: ReactNode[] = []
  let at = 0
  for (const m of text.matchAll(TAG)) {
    if (m.index! > at) out.push(text.slice(at, m.index))
    out.push(
      <span key={m.index} className="tag">
        {m[0]}
      </span>,
    )
    at = m.index! + m[0].length
  }
  if (at < text.length) out.push(text.slice(at))
  return out
}
