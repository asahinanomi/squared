import type { Session } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { finishSignIn, supabase } from '../lib/supabase'
import { demo } from './app'

/** Who's signed in. `session` is undefined while still checking, null when signed out. */
export function useAuth() {
  const [session, setSession] = useState<Session | null | undefined>(demo ? null : undefined)
  const [demoIn, setDemoIn] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) return
    const sb = supabase
    // Back from Google, the sign-in finishes first: until then, "nobody yet" is not an answer (it would flash the
    // sign-in screen for a moment).
    let finishing = true
    finishSignIn().then(async (err) => {
      setAuthError(err)
      const { data } = await sb.auth.getSession()
      finishing = false
      setSession(data.session)
    })
    const { data } = sb.auth.onAuthStateChange((_e, s) => {
      if (finishing && !s) return
      setSession(s)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const userId = session?.user.id
  const signedIn = demo ? demoIn : !!userId
  // The painter's signature on a month's painting: the first name.
  const painter = (session?.user.user_metadata?.full_name ?? session?.user.user_metadata?.name ?? '').split(' ')[0]
  return { session, userId, signedIn, painter, authError, setDemoIn }
}
