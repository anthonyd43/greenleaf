'use client'

export function VenmoButton({ href, onTapAction }: { href: string; onTapAction: () => Promise<void> }) {
  return (
    <a
      href={href} target="_blank" rel="noopener noreferrer"
      className="rounded-full bg-mint px-3.5 py-1.5 text-xs font-semibold text-mint-ink transition-colors duration-150 hover:bg-[#c2d8a4]"
      onClick={() => { void onTapAction() }}
    >
      Request
    </a>
  )
}
