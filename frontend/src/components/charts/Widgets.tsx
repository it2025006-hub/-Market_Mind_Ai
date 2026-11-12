import { cn } from '@/lib/utils'

export function Sparkline({ data, positive }: { data: number[]; positive: boolean }) {
  if (data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const width = 96
  const height = 32
  const d = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * width
      const y = max === min ? height / 2 : height - ((value - min) / (max - min)) * (height - 2) - 1
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-8 w-24" aria-hidden>
      <path d={d} fill="none" stroke={positive ? 'var(--bull)' : 'var(--bear)'} strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

export function Gauge({ value, caption }: { value: number; caption: string }) {
  const clamped = Math.min(100, Math.max(0, value))
  const radius = 86
  const length = Math.PI * radius
  const dash = (clamped / 100) * length
  return (
    <div className="relative mx-auto w-full max-w-[280px]">
      <svg viewBox="0 0 220 132" className="w-full" role="img" aria-label={`${caption} ${clamped.toFixed(0)} percent`}>
        <defs>
          <linearGradient id="gauge" x1="0" x2="1">
            <stop offset="0%" stopColor="#EA3943" />
            <stop offset="50%" stopColor="#F5B942" />
            <stop offset="100%" stopColor="#16C784" />
          </linearGradient>
        </defs>
        <path d="M24 112 A86 86 0 0 1 196 112" fill="none" stroke="var(--card-2)" strokeWidth="14" strokeLinecap="round" />
        <path
          d="M24 112 A86 86 0 0 1 196 112"
          fill="none"
          stroke="url(#gauge)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${length}`}
        />
      </svg>
      <div className="absolute inset-x-0 bottom-2 text-center">
        <div className="num text-4xl font-medium text-ink">{clamped.toFixed(0)}%</div>
        <div className="text-xs uppercase tracking-[0.16em] text-mute">{caption}</div>
      </div>
    </div>
  )
}

export function ContributionBars({ items }: { items: { name: string; value: number }[] }) {
  const max = Math.max(0.05, ...items.map((item) => Math.abs(item.value)))
  return (
    <div className="space-y-3">
      {items.map((item) => {
        const width = (Math.abs(item.value) / max) * 50
        return (
          <div key={item.name}>
            <div className="mb-1 flex items-center justify-between gap-3 text-xs">
              <span className="text-ink">{item.name}</span>
              <span className={cn('num', item.value >= 0 ? 'text-bull' : 'text-bear')}>
                {item.value >= 0 ? '+' : ''}
                {item.value.toFixed(3)}
              </span>
            </div>
            <div className="relative h-2.5 overflow-hidden rounded-full bg-card2">
              <div className="absolute left-1/2 top-0 h-full w-px bg-line" />
              <div
                className={cn('absolute top-0 h-full rounded-full', item.value >= 0 ? 'bg-bull' : 'bg-bear')}
                style={item.value >= 0 ? { left: '50%', width: `${width}%` } : { right: '50%', width: `${width}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function Meter({ label, value, hint }: { label: string; value: number; hint: string }) {
  const width = Math.min(100, Math.max(0, value * 100))
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-mute">{label}</span>
        <span className="num text-ink">{width.toFixed(0)}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-card2">
        <div className="h-full rounded-full bg-accent" style={{ width: `${width}%` }} />
      </div>
      <p className="mt-1 text-[11px] leading-4 text-mute">{hint}</p>
    </div>
  )
}
