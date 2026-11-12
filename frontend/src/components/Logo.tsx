import { cn } from '@/lib/utils'

export function Logo({ compact = false, light = false }: { compact?: boolean; light?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <svg viewBox="0 0 32 32" className="h-9 w-9 shrink-0" aria-hidden>
        <rect width="32" height="32" rx="9" fill="#2684FF" />
        <path d="M7 22.5 12.2 13.8l3.2 4.1L20.2 9.2 25 16.8" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M21.4 9.2H25V12.8" fill="none" stroke="#22D3EE" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
      {!compact && (
        <div className="min-w-0">
          <div className={cn('truncate text-sm font-semibold tracking-tight', light ? 'text-white' : 'text-ink')}>MarketMind AI</div>
          <div className={cn('truncate text-[11px]', light ? 'text-slate-300' : 'text-mute')}>Understand the market</div>
        </div>
      )}
    </div>
  )
}
