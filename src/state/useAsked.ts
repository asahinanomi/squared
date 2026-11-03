import { useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

/** The questions my days asks once, at their moment: after a week painted, after the first red day. */
export type Ask = 'week' | 'red'

const KEY = 'squared.asked'

function onDevice(): Ask[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]')
  } catch {
    return []
  }
}

/**
 * Which have been asked (answered, or skipped): never again. Kept with the account (so a second phone doesn't ask
 * again), and on the device for the demo and until the account has it.
 */
export function useAsked(session: Session | null | undefined) {
  const saved: Ask[] = session?.user.user_metadata?.asked ?? []
  const [here, setHere] = useState<Ask[]>(onDevice)
  const asked = new Set([...saved, ...here])
  const done = (a: Ask) => {
    if (asked.has(a)) return
    const next = [...asked, a]
    setHere(next)
    try {
      localStorage.setItem(KEY, JSON.stringify(next))
    } catch {
      /* the account keeps it */
    }
    if (supabase && session) supabase.auth.updateUser({ data: { asked: next } }).catch(() => undefined)
  }
  return { asked: (a: Ask) => asked.has(a), done }
}
