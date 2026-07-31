'use client'

import { useState } from 'react'
import type { UtilityTrendData } from '@/lib/trends'
import { formatCents } from '@/lib/money'

const X0 = 16, X1 = 544, Y0 = 20, Y1 = 150

/** 'July 2026' → 'Jul' */
function shortLabel(label: string) {
  return label.split(' ')[0].slice(0, 3)
}

export function UtilityTrends({ data }: { data: UtilityTrendData }) {
  const utilities = Object.keys(data.series).filter(k => k !== 'All')
  const chips = ['All', ...utilities]
  const maxRange = Math.min(12, data.cycles.length)
  const [util, setUtil] = useState('All')
  const [range, setRange] = useState(maxRange)
  const [hover, setHover] = useState<number | null>(null)

  if (data.cycles.length < 2) {
    return (
      <div className="rounded-[20px] border border-line bg-card p-5">
        <span className="text-[15px] font-semibold text-ink">Utility trends</span>
        <p className="mt-2 text-sm text-ink-2">Not enough cycles yet — trends appear after two cycles.</p>
      </div>
    )
  }

  const shown = Math.max(2, Math.min(range, maxRange))
  const full = data.series[util] ?? data.series.All
  const series = full.slice(data.cycles.length - shown)
  const labels = data.cycles.slice(data.cycles.length - shown)

  const lo = Math.min(...series)
  const hi = Math.max(...series)
  const pad = hi - lo < 1 ? 500 : (hi - lo) * 0.15
  const yMin = lo - pad
  const yMax = hi + pad
  const px = (i: number) => (series.length === 1 ? (X0 + X1) / 2 : X0 + ((X1 - X0) * i) / (series.length - 1))
  const py = (v: number) => Y1 - ((v - yMin) / (yMax - yMin)) * (Y1 - Y0)
  const pts = series.map((v, i) => [px(i), py(v)] as const)
  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')
  const areaPath = `${linePath} L${X1} ${Y1} L${pts[0][0].toFixed(1)} ${Y1} Z`

  const latest = series[series.length - 1]
  const avg = Math.round(series.reduce((a, v) => a + v, 0) / series.length)
  const hoverOn = hover != null && hover < pts.length
  const tipLeftPct = hoverOn ? Math.min(Math.max((pts[hover][0] / 560) * 100, 8), 82) : 0

  return (
    <div className="rounded-[20px] border border-line bg-card p-5">
      <div className="mb-3.5 flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-base font-semibold text-ink">Utility trends</span>
        <span className="text-[13px] tabular-nums text-ink-2">
          {util} · latest {formatCents(latest)} · avg {formatCents(avg)}
        </span>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {chips.map(name => {
          const on = util === name
          return (
            <button
              key={name}
              type="button"
              onClick={() => setUtil(name)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors duration-150 ${
                on
                  ? 'border border-mint bg-mint text-mint-ink'
                  : 'border border-line text-ink-2 hover:border-accent/40 hover:text-ink'
              }`}
            >
              {name}
            </button>
          )
        })}
      </div>

      <div className="relative">
        <svg viewBox="0 0 560 190" className="block w-full">
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#a4c07f" stopOpacity="0.35" />
              <stop offset="1" stopColor="#a4c07f" stopOpacity="0" />
            </linearGradient>
          </defs>
          <line x1={X0} y1={20} x2={X1} y2={20} stroke="rgba(148,163,184,0.08)" />
          <line x1={X0} y1={85} x2={X1} y2={85} stroke="rgba(148,163,184,0.08)" />
          <line x1={X0} y1={150} x2={X1} y2={150} stroke="rgba(148,163,184,0.08)" />
          <path d={areaPath} fill="url(#trendFill)" />
          <path d={linePath} fill="none" stroke="#a4c07f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {pts.map((p, i) => (
            <circle
              key={i}
              cx={p[0].toFixed(1)}
              cy={p[1].toFixed(1)}
              r={i === pts.length - 1 ? 5 : 3.5}
              fill={i === pts.length - 1 ? '#d6e5c8' : '#a4c07f'}
              stroke="#1c1f2f"
              strokeWidth="2"
            />
          ))}
          {pts.map((p, i) => {
            const left = i === 0 ? X0 : (pts[i - 1][0] + p[0]) / 2
            const right = i === pts.length - 1 ? X1 : (p[0] + pts[i + 1][0]) / 2
            return (
              <rect
                key={i}
                x={left.toFixed(1)}
                y={0}
                width={(right - left).toFixed(1)}
                height={190}
                fill="transparent"
                className="cursor-crosshair"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              />
            )
          })}
          {hoverOn && (
            <g className="pointer-events-none">
              <line
                x1={pts[hover][0].toFixed(1)}
                y1={20}
                x2={pts[hover][0].toFixed(1)}
                y2={150}
                stroke="rgba(214,229,200,0.35)"
                strokeDasharray="3 3"
              />
              <circle cx={pts[hover][0].toFixed(1)} cy={pts[hover][1].toFixed(1)} r={6} fill="#d6e5c8" stroke="#1c1f2f" strokeWidth="2" />
            </g>
          )}
        </svg>
        <div className="pointer-events-none absolute right-1 top-0.5 text-[10px] tabular-nums text-ink-3">
          {formatCents(hi)}
        </div>
        <div className="pointer-events-none absolute bottom-3.5 right-1 text-[10px] tabular-nums text-ink-3">
          {formatCents(lo)}
        </div>
        {hoverOn && (
          <div
            className="pointer-events-none absolute top-2.5 -translate-x-1/2 whitespace-nowrap rounded-[10px] border border-accent/35 bg-sidebar px-3 py-1.5 shadow-[0_4px_16px_rgba(0,0,0,0.4)]"
            style={{ left: `${tipLeftPct.toFixed(1)}%` }}
          >
            <div className="text-[13px] font-semibold tabular-nums text-ink">{formatCents(series[hover])}</div>
            <div className="mt-px text-[11px] text-ink-2">{labels[hover].label}</div>
          </div>
        )}
      </div>

      <div className="mt-1 flex justify-between px-2">
        {labels.map(c => (
          <span key={c.cycleId} className="text-[10px] text-ink-3">
            {shortLabel(c.label)}
          </span>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-3.5 border-t border-line pt-3.5">
        <span className="shrink-0 text-xs text-ink-2">Last {shown} cycles</span>
        <input
          type="range"
          min={2}
          max={maxRange}
          step={1}
          value={shown}
          onChange={e => setRange(Number(e.target.value))}
          className="flex-1 cursor-pointer accent-[#a4c07f]"
        />
        <span className="shrink-0 text-xs text-ink-3">{maxRange}</span>
      </div>
    </div>
  )
}
