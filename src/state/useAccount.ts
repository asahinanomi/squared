import { useCallback, useEffect, useRef, useState } from 'react'
import { QUESTION } from '../lib/config'
import { todayIso } from '../lib/dates'
import { fetchAllDays, type Days } from '../lib/days'
import { mockDays } from '../lib/mock'
import { fetchAllNotes, fetchMonthNotes, legacyNotes, type Notes } from '../lib/notes'
import { fetchProfile, type Profile } from '../lib/profile'
import { reportError } from '../lib/report'
import { fetchQuestion } from '../lib/supabase'
import { demo, legalAtStart, tryWelcome } from './app'

/** What the account holds for whoever is signed in: the question, the profile, every painted day, and the notes
 *  (a month at a time). Loaded from the account on sign-in; never an empty life in place of one that didn't load. */
export function useAccount(userId: string | undefined) {
  const [question, setQuestion] = useState(QUESTION)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profileReady, setProfileReady] = useState(false)
  const [days, setDays] = useState<Days>(() => (demo ? mockDays() : {}))
  const [daysReady, setDaysReady] = useState(demo) // the demo's days are there from the start
  const [notes, setNotes] = useState<Notes>({})
  const [loadFailed, setLoadFailed] = useState(false)
  // Signed in on a device that hasn't settled whether this is someone new: wait for the days before showing
  // anything, so today never flashes up before the welcome.
  const [checking, setChecking] = useState(() => !legalAtStart && !tryWelcome)
  const notesLoaded = useRef(new Set<string>())

  // The demo keeps its profile on this device.
  useEffect(() => {
    if (demo)
      fetchProfile()
        .then(setProfile)
        .finally(() => setProfileReady(true))
  }, [])

  useEffect(() => {
    if (!userId) {
      if (!demo) {
        setDays({})
        setNotes({})
      }
      return
    }
    fetchQuestion().then((q) => q && setQuestion(q))
    fetchProfile()
      .then(setProfile)
      .catch(() => undefined)
      .finally(() => setProfileReady(true))
    notesLoaded.current = new Set([todayIso().slice(0, 7)])
    Promise.all([fetchAllDays(), fetchMonthNotes(todayIso())])
      .then(([d, n]) => {
        setDays(d)
        setNotes(n ?? legacyNotes(d))
        setLoadFailed(false)
      })
      .catch((e) => {
        console.error('Could not load days', e)
        reportError('load days', e)
        setLoadFailed(true) // never show an empty life in place of one that didn't load
      })
      .finally(() => {
        setChecking(false)
        setDaysReady(true)
      })
  }, [userId])

  // Notes load a month at a time, as you visit days in it (or read past them on the month).
  const loadNotes = useCallback(
    (iso: string) => {
      const m = iso.slice(0, 7)
      if (!userId || notesLoaded.current.has(m)) return
      notesLoaded.current.add(m)
      fetchMonthNotes(iso)
        .then((n) => n && setNotes((all) => ({ ...all, ...n })))
        .catch((e) => {
          notesLoaded.current.delete(m)
          console.error('Could not load notes', e)
        })
    },
    [userId],
  )
  // Every note at once (the list's "only with notes"): fills in the months not loaded yet; loaded months keep what's
  // on screen.
  const allNotes = useRef(false)
  const loadAllNotes = useCallback(() => {
    if (!userId || allNotes.current) return
    allNotes.current = true
    fetchAllNotes()
      .then((n) => {
        if (!n) return
        const fresh = Object.fromEntries(Object.entries(n).filter(([iso]) => !notesLoaded.current.has(iso.slice(0, 7))))
        for (const iso of Object.keys(n)) notesLoaded.current.add(iso.slice(0, 7))
        setNotes((all) => ({ ...fresh, ...all }))
      })
      .catch((e) => {
        allNotes.current = false
        console.error('Could not load notes', e)
      })
  }, [userId])

  return {
    question,
    profile,
    setProfile,
    profileReady,
    days,
    setDays,
    daysReady,
    notes,
    setNotes,
    loadNotes,
    loadAllNotes,
    loadFailed,
    checking,
  }
}
export type Account = ReturnType<typeof useAccount>
