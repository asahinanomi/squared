export type Paint = 'green' | 'grey' | 'red'

export const PAINTS: { id: Paint; hex: string; meaning: string }[] = [
  { id: 'green', hex: '#6b9e7b', meaning: 'I was aware of it, and spent it meaningfully.' },
  { id: 'grey', hex: '#a8a8a1', meaning: "I wasn't really there. The day slipped by." },
  { id: 'red', hex: '#c4695f', meaning: "I was aware of it, but didn't spend it meaningfully." },
]

export const paintHex = (p: Paint) => PAINTS.find((x) => x.id === p)!.hex
