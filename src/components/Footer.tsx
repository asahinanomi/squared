type Props = {
  /** The small print, in order: each a word and where it leads. */
  links: [string, () => void][]
  /** Sign-in's page is centred, so its footer is too; everywhere else it sits left, with the text. */
  centred?: boolean
}

// The one footer: the small print (faq · privacy · terms…) and the mark, "© 2026 squared.today beta".
// The same everywhere it appears: sign-in, settings, the idea.
export function Footer({ links, centred }: Props) {
  return (
    <footer className={'foot' + (centred ? ' is-centred' : '')}>
      <p className="foot-links">
        {links.map(([label, go], i) => (
          <span key={label}>
            {i > 0 && <span aria-hidden="true">·</span>}
            <button onClick={go}>{label}</button>
          </span>
        ))}
      </p>
      <p className="foot-mark">
        © {new Date().getFullYear()} squared.today <b className="beta">beta</b>
      </p>
    </footer>
  )
}
