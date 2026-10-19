export type Paint = 'green' | 'grey' | 'red'

// hex: a day painted on the day itself; tint: one shade lighter, a day painted later (backfilled).
export const PAINTS: { id: Paint; hex: string; tint: string; meaning: string }[] = [
  { id: 'green', hex: '#6E9B7B', tint: '#A7C4B0', meaning: 'yes — I spent it on what matters.' },
  { id: 'grey', hex: '#8E8E87', tint: '#AEAEA6', meaning: 'I don’t know — I wasn’t paying attention.' },
  { id: 'red', hex: '#C06A62', tint: '#D9A8A3', meaning: 'no — I was busy, but none of it mattered.' },
]

export const paintHex = (p: Paint) => PAINTS.find((x) => x.id === p)!.hex

export const paintTint = (p: Paint) => PAINTS.find((x) => x.id === p)!.tint
