import { describe, expect, it } from 'vitest'
import { questionFor } from './question'

const Q = 'did I spend Today meaningfully?'

describe('the question follows the day', () => {
  it('asks about now until today is painted, at any hour', () => {
    expect(questionFor(Q, true, false)).toBe('am I spending Today meaningfully?')
  })
  it('looks back once today is painted', () => {
    expect(questionFor(Q, true, true)).toBe(Q)
  })
  it('asks about "this day" on any other day', () => {
    expect(questionFor(Q, false, false)).toBe('did I spend this day meaningfully?')
  })
})
