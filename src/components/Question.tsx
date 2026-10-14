type Props = { text: string; onDefine: () => void }

// Renders the stored question; the "meaning…" word opens the definition sheet.
export function Question({ text, onDefine }: Props) {
  const m = text.match(/\bmeaning\w*/i)
  if (!m || m.index === undefined) return <h1 className="question">{text}</h1>
  const before = text.slice(0, m.index)
  const after = text.slice(m.index + m[0].length)
  return (
    <h1 className="question">
      {before}
      <button className="define" onClick={onDefine}>
        {m[0]}
      </button>
      {after}
    </h1>
  )
}
