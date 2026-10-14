export type Paint = 'green' | 'grey' | 'red'

export const PAINTS: { id: Paint; hex: string; meaning: string }[] = [
  { id: 'green', hex: '#6b9e7b', meaning: 'Conscious, and meaningful.' },
  { id: 'grey', hex: '#a8a8a1', meaning: "It went by, and I don't know where." },
  { id: 'red', hex: '#c4695f', meaning: 'Conscious, but spent poorly.' },
]

export const paintHex = (p: Paint) => PAINTS.find((x) => x.id === p)!.hex
