// Original vector leaf mark: gradient body, surface-colored swoosh vein, curled stem.
export function LeafLogo({
  size = 20,
  className,
  veinColor = '#141624',
  gradientId = 'leafGrad',
}: {
  size?: number
  className?: string
  veinColor?: string
  gradientId?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={gradientId} x1="1" y1="0" x2="0.15" y2="1">
          <stop offset="0" stopColor="#d6e5c8" />
          <stop offset="1" stopColor="#7d9a58" />
        </linearGradient>
      </defs>
      {/* stem — curled hook at the lower left */}
      <path
        d="M14 41.5C9.5 46.5 7 52.5 7.6 59c.1 1-1.6 1.2-2.2.3-.8-6.8 1.9-13.7 6.1-18.8Z"
        fill="#7d9a58"
      />
      {/* leaf body */}
      <path
        d="M57 7C52 8 30 10 19 24c-6 7.6-8 15-6 20 4.5 11 25 13 38-2 8.3-9.6 7.3-27 6-35Z"
        fill={`url(#${gradientId})`}
      />
      {/* swoosh vein — cut in the surface color behind the logo */}
      <path
        d="M15.5 43.5C27 28 41 17.5 53 12 40.5 20 28.5 30 19 44c-1.4 1.2-3 .8-3.5-.5Z"
        fill={veinColor}
      />
    </svg>
  )
}
