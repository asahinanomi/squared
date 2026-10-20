type Props = { size?: number }

export function Logo({ size = 30 }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-label="squared.today" role="img">
      <path
        d="M8 80C22 64 34 57 48 55C62 53 70 51 76 46C81 42 86 40 92 39V80Q92 92 80 92H20Q8 92 8 80Z"
        fill="currentColor"
      />
      <rect x="7" y="7" width="86" height="86" rx="18" fill="none" stroke="currentColor" strokeWidth="10" />
    </svg>
  )
}
