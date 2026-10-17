import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { SwipeRow } from '../components/SwipeRow'
import { loadMatters, MAX_CHARS, newEntry, saveMatters, type Entry, type Kind, type Matters } from '../lib/matters'
import { paintHex } from '../lib/paints'
import { Chevron } from './Today'

type Props = { onBack: () => void; /** Where back leads: "settings" or "the idea". */ backLabel?: string }

const LISTS: { kind: Kind; label: string; dot: string; hint: string }[] = [
  { kind: 'meaningful', label: 'meaningful', dot: paintHex('green'), hint: 'what does a meaningful day look like?' },
  { kind: 'empty', label: 'empty', dot: paintHex('grey'), hint: 'what makes a day feel empty?' },
]

/** A text box that grows with what's typed (one or two lines). */
function EntryInput({ entry, onChange, onDone }: { entry: Entry; onChange: (t: string) => void; onDone: () => void }) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [entry.text])
  useEffect(() => ref.current?.focus(), [])
  return (
    <textarea
      ref={ref}
      className="matters-input"
      rows={1}
      maxLength={MAX_CHARS}
      value={entry.text}
      placeholder="write it in a line or two"
      onChange={(e) => onChange(e.target.value.replace(/\n/g, ' '))}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          onDone()
        }
      }}
      onBlur={onDone}
    />
  )
}

// What matters: two short lists — what a meaningful day and an empty day look like to you.
// Your compass when you paint; it never judges or colours a day for you. Every change saves itself.
export function WhatMatters({ onBack, backLabel = 'settings' }: Props) {
  const [lists, setLists] = useState<Matters>(loadMatters)
  const [editing, setEditing] = useState<string | null>(null)
  const [swiped, setSwiped] = useState<string | null>(null)

  useEffect(() => saveMatters(lists), [lists])

  const update = (kind: Kind, fn: (l: Entry[]) => Entry[]) => setLists((m) => ({ ...m, [kind]: fn(m[kind]) }))
  const add = (kind: Kind) => {
    const e = newEntry()
    update(kind, (l) => [...l, e])
    setSwiped(null)
    setEditing(e.id)
  }
  const done = (kind: Kind, id: string) => {
    // A cleared entry goes away.
    update(kind, (l) => l.map((e) => (e.id === id ? { ...e, text: e.text.trim() } : e)).filter((e) => e.text))
    setEditing((cur) => (cur === id ? null : cur))
  }

  return (
    <main className="matters">
      <button className="back-btn matters-back" onClick={onBack} aria-label={`Back to ${backLabel}`}>
        <Chevron dir="left" />
        {backLabel}
      </button>
      <h1 className="settings-title">what matters</h1>
      <p className="matters-lede">
        what a meaningful day looks like to you — and what feels empty. your compass when you paint.
      </p>

      {LISTS.map(({ kind, label, dot, hint }) => (
        <section key={kind} className="matters-list" aria-label={label}>
          <h2 className="matters-head">
            <span className="matters-dot" style={{ background: dot }} aria-hidden="true" />
            {label}
          </h2>
          {lists[kind].map((e) =>
            editing === e.id ? (
              <EntryInput
                key={e.id}
                entry={e}
                onChange={(t) => update(kind, (l) => l.map((x) => (x.id === e.id ? { ...x, text: t } : x)))}
                onDone={() => done(kind, e.id)}
              />
            ) : (
              <SwipeRow
                key={e.id}
                open={swiped === e.id}
                onOpenChange={(o) => setSwiped(o ? e.id : null)}
                onDelete={() => {
                  setSwiped(null)
                  update(kind, (l) => l.filter((x) => x.id !== e.id))
                }}
              >
                <button className="matters-entry" onClick={() => setEditing(e.id)}>
                  {e.text}
                </button>
              </SwipeRow>
            ),
          )}
          <button className="matters-add" onClick={() => add(kind)} aria-label={`add — ${hint}`}>
            <span aria-hidden="true">+</span> add
          </button>
        </section>
      ))}

      <p className="matters-foot">a guide, not a rule — you still choose the day's colour</p>
    </main>
  )
}
