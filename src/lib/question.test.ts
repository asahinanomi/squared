import { afterEach, describe, expect, it, vi } from 'vitest'
import { questionFor } from './question'

const Q = 'did I spend Today meaningfully?'
const at = (h: number) => vi.setSystemTime(new Date(2026, 9, 24, h, 0))

describe('the question follows the day', () => {
  afterEach(() => {
    vi.useRealTimers()
  })
  it('asks about now while today is blank, before 6pm', () => {
    vi.useFakeTimers()
    at(9)
    expect(questionFor(Q, true, false)).toBe('am I spending Today meaningfully?')
  })
  it('looks back in the evening, or once today is painted', () => {
    vi.useFakeTimers()
    at(19)
    expect(questionFor(Q, true, false)).toBe(Q)
    at(9)
    expect(questionFor(Q, true, true)).toBe(Q)
  })
  it('asks about "this day" on any other day', () => {
    expect(questionFor(Q, false, false)).toBe('did I spend this day meaningfully?')
  })
})
