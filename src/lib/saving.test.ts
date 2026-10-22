import { beforeEach, describe, expect, it, vi } from 'vitest'

// The two parts of saving that must never lose anything, against a fake account: what matters (saved line by line)
// and the save queue (a blip is retried quietly; a real failure says so and waits for "try again").

const db = vi.hoisted(() => ({
  rows: new Map<string, { id: string; kind: string; text: string; position: number }>(),
  down: 0,
}))
vi.mock('./supabase', () => {
  const fail = () => Object.assign(new Error('Fetch is aborted'), { code: '' })
  return {
    supabase: {
      from: () => ({
        select: () => ({
          order: async () =>
            db.down
              ? { data: null, error: fail() }
              : { data: [...db.rows.values()].sort((a, b) => a.position - b.position), error: null },
        }),
        upsert: async (rows: { id: string; kind: string; text: string; position: number }[]) => {
          if (db.down) return (db.down--, { error: fail() })
          for (const r of rows) db.rows.set(r.id, { ...db.rows.get(r.id), ...r })
          return { error: null }
        },
        delete: () => ({
          eq: async (_: string, id: string) => {
            if (db.down) return (db.down--, { error: fail() })
            db.rows.delete(id)
            return { error: null }
          },
        }),
      }),
    },
  }
})
vi.mock('./report', () => ({ reportError: () => {}, sendErrors: async () => {} }))

const { fetchMatters, saveMatters } = await import('./matters')
const { retrySaves, saveState } = await import('./save')
type M = Awaited<ReturnType<typeof fetchMatters>>

const e = (id: string, text = id) => ({ id, text })
const idle = () =>
  new Promise<void>((r) => {
    const t = setInterval(() => {
      const s = saveState()
      if (!s.waiting || s.failed) {
        clearInterval(t)
        r()
      }
    }, 10)
  })
const texts = (m: M) => [m.meaningful.map((x) => x.text).join(','), m.wasted.map((x) => x.text).join(',')]

describe('what matters, saved line by line', () => {
  beforeEach(() => {
    db.rows.clear()
    db.down = 0
  })

  it('adds, reorders, edits and deletes', async () => {
    const empty: M = { meaningful: [], wasted: [] }
    const a: M = { meaningful: [e('a', 'family'), e('b', 'walk'), e('c', 'make')], wasted: [e('x', 'scroll')] }
    saveMatters(empty, a)
    await idle()
    expect(texts(await fetchMatters())).toEqual(['family,walk,make', 'scroll'])
    const b: M = { meaningful: [e('c', 'make'), e('a', 'family'), e('b', 'long walk')], wasted: a.wasted }
    saveMatters(a, b)
    await idle()
    expect(texts(await fetchMatters())).toEqual(['make,family,long walk', 'scroll'])
    saveMatters(b, { ...b, wasted: [] })
    await idle()
    expect(texts(await fetchMatters())).toEqual(['make,family,long walk', ''])
  })

  it('keeps both when two devices add a line each', async () => {
    const base: M = { meaningful: [e('a', 'family')], wasted: [] }
    saveMatters({ meaningful: [], wasted: [] }, base)
    await idle()
    saveMatters(base, { ...base, meaningful: [...base.meaningful, e('p', 'read')] }) // the phone
    await idle()
    saveMatters(base, { ...base, meaningful: [...base.meaningful, e('q', 'cook')] }) // the computer, not refreshed
    await idle()
    expect(texts(await fetchMatters())[0]).toBe('family,read,cook')
  })
})

describe('the save queue', () => {
  beforeEach(() => {
    db.rows.clear()
    db.down = 0
  })

  it('retries a blip quietly', async () => {
    db.down = 1
    saveMatters({ meaningful: [], wasted: [] }, { meaningful: [e('a', 'family')], wasted: [] })
    await idle()
    expect(saveState().failed).toBe(false)
    expect(texts(await fetchMatters())[0]).toBe('family')
  })

  it('says "not saved" when it can’t get through, and saves on "try again"', async () => {
    db.down = 2
    saveMatters({ meaningful: [], wasted: [] }, { meaningful: [e('a', 'family')], wasted: [] })
    await idle()
    expect(saveState()).toMatchObject({ failed: true, waiting: 1 })
    retrySaves()
    await idle()
    expect(saveState().failed).toBe(false)
    expect(texts(await fetchMatters())[0]).toBe('family')
  })
})
