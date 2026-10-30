import type { Days } from './days'
import { fromIso, todayIso } from './dates'
import type { Matters } from './matters'
import type { Notes } from './notes'
import { counted, PAINTS, paintHex, WORD } from './paints'
import type { Profile } from './profile'

// "export my data": your squares and notes as a Word document you can read anywhere (Word, Google Docs, Pages),
// and a full copy as JSON. Made on the phone; the Word maker loads only when you ask for it.

export type Everything = { days: Days; notes: Notes; matters: Matters; profile: Profile | null }

const longDay = (iso: string) =>
  fromIso(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
const time = (at: string) =>
  new Date(at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).toLowerCase()
const plain = (iso: string) =>
  fromIso(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
const monthOf = (iso: string) => fromIso(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

/** Hand the browser a file to save. */
export function save(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

const stamp = () => todayIso()

/** Everything, exactly: for keeping, or bringing back one day. */
export function exportJson(all: Everything) {
  const body = JSON.stringify({ exported: new Date().toISOString(), app: 'squared.today', ...all }, null, 2)
  save(new Blob([body], { type: 'application/json' }), `squared-${stamp()}.json`)
}

/** A readable journal: a heading per month (newest first), each day's colour and notes, then what matters. */
export async function exportWord(all: Everything) {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx')
  const INK = '141413'
  const SOFT = '6F6F6A'
  const font = 'Inter'
  const run = (text: string, o: { bold?: boolean; color?: string; size?: number; italics?: boolean } = {}) =>
    new TextRun({ text, font, color: o.color ?? INK, bold: o.bold, italics: o.italics, size: o.size ?? 22 })

  const dates = [...new Set([...Object.keys(all.days), ...Object.keys(all.notes)])].sort().reverse()
  const months: string[] = []
  for (const d of dates) if (months[months.length - 1] !== d.slice(0, 7)) months.push(d.slice(0, 7))

  const body: InstanceType<typeof Paragraph>[] = []
  body.push(new Paragraph({ heading: HeadingLevel.TITLE, children: [run('my squared', { bold: true, size: 48 })] }))
  const about = [
    all.profile && `born ${plain(all.profile.born)}`,
    all.profile && `hoping for ${all.profile.lifespan} years`,
    `exported ${plain(todayIso())}`,
  ].filter(Boolean)
  body.push(new Paragraph({ spacing: { after: 360 }, children: [run(about.join(' · '), { color: SOFT })] }))

  if (!dates.length) body.push(new Paragraph({ children: [run('No painted days yet.', { color: SOFT })] }))

  for (const m of months) {
    const inMonth = dates.filter((d) => d.startsWith(m))
    const counts = PAINTS.map((p) => [p.id, inMonth.filter((d) => all.days[d]?.color === p.id).length] as const)
      .filter(([, n]) => n)
      .map(([p, n]) => counted(p, n))
      .join(' · ')
    body.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 360, after: 60 },
        children: [run(monthOf(`${m}-01`), { bold: true, size: 32 })],
      }),
    )
    if (counts) body.push(new Paragraph({ spacing: { after: 160 }, children: [run(counts, { color: SOFT })] }))
    for (const d of inMonth) {
      const day = all.days[d]
      body.push(
        new Paragraph({
          spacing: { before: 200, after: 40 },
          children: [
            run(longDay(d), { bold: true }),
            ...(day
              ? [run('   '), run('■ ', { color: paintHex(day.color).slice(1) }), run(WORD[day.color], { color: SOFT })]
              : []),
          ],
        }),
      )
      for (const n of all.notes[d] ?? [])
        body.push(
          new Paragraph({
            spacing: { after: 80 },
            children: [
              run(`${time(n.writtenAt)}  `, { color: SOFT, size: 18 }),
              // A moment painted in its own colour keeps its word, in its paint.
              ...(n.color ? [run(`${WORD[n.color]}  `, { color: paintHex(n.color).slice(1), size: 18 })] : []),
              run(n.body),
            ],
          }),
        )
    }
  }

  const lists: [string, string[]][] = [
    ['mattered', all.matters.meaningful.map((e) => e.text)],
    ['empty', all.matters.wasted.map((e) => e.text)],
  ]
  if (lists.some(([, l]) => l.length)) {
    body.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 480, after: 120 },
        children: [run('what matters', { bold: true, size: 32 })],
      }),
    )
    for (const [label, l] of lists) {
      if (!l.length) continue
      body.push(new Paragraph({ spacing: { before: 120 }, children: [run(label, { bold: true })] }))
      for (const t of l) body.push(new Paragraph({ bullet: { level: 0 }, children: [run(t)] }))
    }
  }

  const doc = new Document({ creator: 'squared.today', title: 'my squared', sections: [{ children: body }] })
  save(await Packer.toBlob(doc), `squared-${stamp()}.docx`)
}
