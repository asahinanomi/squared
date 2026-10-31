import { useEffect } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { askedD } from './app'

/** Whether today shows layout D (on trial): asked for by the link just now, else as saved to the account. */
export function useTodayD(session: Session | null | undefined): boolean {
  useEffect(() => {
    if (askedD === null || !session || !supabase) return
    if (session.user.user_metadata?.today_d === askedD) return
    supabase.auth.updateUser({ data: { today_d: askedD } }).catch(() => undefined)
  }, [session])
  return askedD ?? session?.user.user_metadata?.today_d === true
}
