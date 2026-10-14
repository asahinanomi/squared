import { PAINTS, type Paint } from "../lib/paints";
import "./Palette.css";

type Props = {
  loaded: Paint | null;
  /** Gentle wiggle when someone tries to paint with a clean brush. */
  nudge?: boolean;
  onLoad: (p: Paint) => void;
};

// Well positions on the board (drawn in a 270×190 space; the viewBox crops the empty top). Centers sit ~70 units apart so each
// well's tap zone (r 33 ≈ 46px on a phone) never overlaps its neighbour's.
const WELLS: Record<Paint, { x: number; y: number }> = {
  green: { x: 82, y: 70 },
  grey: { x: 62, y: 136 },
  red: { x: 140, y: 120 },
};

// Outlines stay exactly --keyline wide whatever size the palette is drawn at.
const line = { vectorEffect: "non-scaling-stroke" } as const;

/** Blend a hex color toward white (t > 0) or black (t < 0). */
function shade(hex: string, t: number) {
  const to = t > 0 ? 255 : 0;
  const k = Math.abs(t);
  const ch = (i: number) => {
    const v = parseInt(hex.slice(i, i + 2), 16);
    return Math.round(v + (to - v) * k)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${ch(1)}${ch(3)}${ch(5)}`;
}

const BOARD =
  "M40 46C82 18 170 20 204 50C226 70 214 92 190 98C170 103 166 122 184 138C200 152 178 176 132 178C76 181 20 168 14 120C10 88 16 62 40 46Z";
const TIP =
  "M154 110L170 118C168 134 158 148 140 156C134 158 130 154 132 148C136 134 144 120 154 110Z";

export function Palette({ loaded, nudge, onLoad }: Props) {
  return (
    <svg
      className={"palette" + (nudge ? " is-nudging" : "")}
      viewBox="0 22 270 168"
      role="radiogroup"
      aria-label="Paint palette"
    >
      <defs>
        <filter id="pal-soft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
        <linearGradient id="pal-board" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor="#f8f7f3" />
          <stop offset="1" stopColor="#e7e5de" />
        </linearGradient>
        <linearGradient id="pal-handle" x1="0" y1="0" x2="1" y2="0.55">
          <stop offset="0" stopColor="#5d5d5a" />
          <stop offset="1" stopColor="#262625" />
        </linearGradient>
        <linearGradient id="pal-ferrule" x1="0" y1="0" x2="1" y2="0.5">
          <stop offset="0" stopColor="#f4f4f1" />
          <stop offset="0.55" stopColor="#b4b4af" />
          <stop offset="1" stopColor="#dcdcd7" />
        </linearGradient>
        {PAINTS.map(({ id, hex }) => (
          <g key={id}>
            {/* Domed wet paint: lit from the top-left. */}
            <radialGradient id={`pal-dome-${id}`} cx="0.38" cy="0.32" r="0.75">
              <stop offset="0" stopColor={shade(hex, 0.28)} />
              <stop offset="0.5" stopColor={hex} />
              <stop offset="1" stopColor={shade(hex, -0.24)} />
            </radialGradient>
            {/* The scooped dent: its upper wall falls into shadow, its lower wall catches light. */}
            <linearGradient id={`pal-dent-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={shade(hex, -0.48)} />
              <stop offset="0.6" stopColor={shade(hex, -0.08)} />
              <stop offset="1" stopColor={shade(hex, 0.18)} />
            </linearGradient>
            <linearGradient
              id={`pal-tip-${id}`}
              x1="0.7"
              y1="0"
              x2="0.2"
              y2="1"
            >
              <stop offset="0" stopColor={shade(hex, 0.16)} />
              <stop offset="1" stopColor={shade(hex, -0.22)} />
            </linearGradient>
          </g>
        ))}
        <linearGradient id="pal-tip-clean" x1="0.7" y1="0" x2="0.2" y2="1">
          <stop offset="0" stopColor="#f7f6f2" />
          <stop offset="1" stopColor="#dcdad3" />
        </linearGradient>
      </defs>

      <g transform="scale(1.1 1)">
        <path
          className="palette-shadow"
          d={BOARD}
          transform="translate(1 4)"
          filter="url(#pal-soft)"
        />
        <path
          className="palette-board"
          style={line}
          d={BOARD}
          fill="url(#pal-board)"
        />
      </g>

      {PAINTS.map(({ id }) => {
        const { x, y } = WELLS[id];
        const on = loaded === id;
        return (
          <g
            key={id}
            className={"well" + (on ? " is-loaded" : "")}
            role="radio"
            aria-checked={on}
            aria-label={id}
            tabIndex={0}
            onClick={() => onLoad(id)}
            onKeyDown={(e) =>
              (e.key === "Enter" || e.key === " ") && onLoad(id)
            }
          >
            <circle className="well-hit" cx={x} cy={y} r={33} />
            <g
              className="well-body"
              style={{ transformOrigin: `${x}px ${y}px` }}
            >
              <circle className="well-ring" style={line} cx={x} cy={y} r={29} />
              <circle className="well-contact" cx={x + 1.5} cy={y + 3} r={23} />
              <circle
                className="well-paint"
                style={line}
                cx={x}
                cy={y}
                r={23}
                fill={`url(#pal-dome-${id})`}
              />
              <g transform={`translate(${x} ${y})`}>
                <path
                  className="well-gloss"
                  d="M-16 -3C-16 -12 -9 -18 -1 -18C-8 -15 -12 -10 -13 -2Z"
                />
                <circle className="well-glint" cx={-4} cy={-15} r={1.6} />
                {/* Where the brush dipped: a hollow with a raised, lit lip. */}
                <g transform="translate(3 4) rotate(-28)">
                  <g className="well-dent">
                    <ellipse rx={15} ry={11} fill={`url(#pal-dent-${id})`} />
                    <path className="dent-shade" d="M-12.5 -2.5A13.5 9.5 0 0 1 12.5 -2.5" />
                    <path className="dent-lip" d="M-16 2A16.5 12.5 0 0 0 16 2" />
                  </g>
                </g>
              </g>
            </g>
          </g>
        );
      })}

      {/* Brush resting across the thumb hole, its head full of the loaded paint. */}
      <g className="brush" pointerEvents="none" transform="translate(40 0)">
        <path
          style={line}
          d="M216 14C222 10 230 16 226 23L178 104L164 96L208 18Z"
          className="brush-handle"
        />
        <path d="M214 22L180 82" className="brush-shine" />
        <path
          style={line}
          d="M164 96L178 104L170 118L154 110Z"
          className="brush-ferrule"
        />
        <path d="M163 101L174 107" className="brush-crimp" />
        <path d={TIP} fill="url(#pal-tip-clean)" />
        {PAINTS.map(({ id }) => (
          <path
            key={id}
            d={TIP}
            fill={`url(#pal-tip-${id})`}
            className={"brush-load" + (loaded === id ? " is-on" : "")}
          />
        ))}
        <path style={line} d={TIP} className="brush-tip" />
        <path
          d="M150 122C146 132 142 140 138 148M158 124C154 134 150 142 145 150"
          className="brush-hairs"
        />
        <path d="M160 120C157 128 154 134 150 140" className="brush-wet" />
      </g>
    </svg>
  );
}
