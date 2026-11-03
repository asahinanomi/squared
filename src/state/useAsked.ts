import { useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

/** The questions my days asks once, at their moment: after a week painted, after the first red day. */
export type Ask = 'week' | 'red'

// Per account (the demo is its own): one phone, two accounts, each asked on its own.
const key = (who: string) => `squared.asked.${who}`

function onDevice(who: string): Ask[] {
  try {
    return JSON.parse(localStorage.getItem(key(who)) ?? '[]')
  } catch {
    return []
  }
}

/**
 * Which have been asked (answered, or skipped): never again. Kept with the account (so a second phone doesn't ask
 * again), and on the device for the demo and until the account has it.
 */
export function useAsked(session: Session | null | undefined) {
  const who = session?.user.id ?? 'demo'
  const saved: Ask[] = session?.user.user_metadata?.asked ?? []
  const [here, setHere] = useState<{ who: string; list: Ask[] }>(() => ({ who, list: onDevice(who) }))
  // Signed in as someone else: their own list.
  const list = here.who === who ? here.list : onDevice(who)
  const asked = new Set([...saved, ...list])
  const done = (a: Ask) => {
    if (asked.has(a)) return
    const next = [...asked, a]
    setHere({ who, list: next })
    try {
      localStorage.setItem(key(who), JSON.stringify(next))
    } catch {
      /* the account keeps it */
    }
    if (supabase && session) supabase.auth.updateUser({ data: { asked: next } }).catch(() => undefined)
  }
  return { asked: (a: Ask) => asked.has(a), done }
}
