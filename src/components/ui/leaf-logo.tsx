// Original vector leaf mark: gradient body, white swoosh vein, curled stem.
export function LeafLogo({ size = 20, className }: { size?: number; className?: string }) {
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
        <linearGradient id="leafGrad" x1="1" y1="0" x2="0.15" y2="1">
          <stop offset="0" stopColor="#a8d75f" />
          <stop offset="0.55" stopColor="#5fae5f" />
          <stop offset="1" stopColor="#3f8b55" />
        </linearGradient>
      </defs>
      {/* stem — curled hook at the lower left */}
      <path
        d="M14 41.5C9.5 46.5 7 52.5 7.6 59c.1 1-1.6 1.2-2.2.3-.8-6.8 1.9-13.7 6.1-18.8Z"
        fill="#35763f"
      />
      {/* leaf body */}
      <path
        d="M57 7C52 8 30 10 19 24c-6 7.6-8 15-6 20 4.5 11 25 13 38-2 8.3-9.6 7.3-27 6-35Z"
        fill="url(#leafGrad)"
      />
      {/* white swoosh vein */}
      <path
        d="M15.5 43.5C27 28 41 17.5 53 12 40.5 20 28.5 30 19 44c-1.4 1.2-3 .8-3.5-.5Z"
        fill="#fff"
      />
    </svg>
  )
}
