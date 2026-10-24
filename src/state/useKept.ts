import type { Session } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { keptPaintings, saveKept } from '../lib/kept'
import { commit } from '../lib/save'
import { demo } from './app'

/** The paintings you kept, for paintings (my days): on the wall at once, and saved to the account like every change. */
export function useKept(session: Session | null | undefined) {
  const [kept, setKept] = useState<string[]>([])
  useEffect(() => setKept(keptPaintings(session?.user.user_metadata?.kept_paintings)), [session])
  const put = (next: string[]) => {
    setKept(next)
    if (demo) void saveKept(next)
    else commit('kept', () => saveKept(next))
  }
  return {
    kept,
    keep: (p: string) => put([...kept.filter((x) => x !== p), p].sort().reverse()),
    remove: (p: string) => put(kept.filter((x) => x !== p)),
  }
}
