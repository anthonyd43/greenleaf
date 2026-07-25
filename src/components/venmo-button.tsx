'use client'

export function VenmoButton({ href, onTapAction }: { href: string; onTapAction: () => Promise<void> }) {
  return (
    <a
      href={href} target="_blank" rel="noopener noreferrer"
      className="rounded-lg bg-accent px-3 py-1.5 text-sm text-white"
      onClick={() => { void onTapAction() }}
    >
      Request
    </a>
  )
}
