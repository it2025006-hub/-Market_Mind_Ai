import { Component, useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

export function SimulatedPill({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border border-amberx/30 bg-amberx/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-amberx', className)}>
      Simulated
    </span>
  )
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'bull' | 'bear' | 'info' | 'warn' }) {
  const tones = {
    neutral: 'border-line bg-card2 text-mute',
    bull: 'border-bull/30 bg-bull/10 text-bull',
    bear: 'border-bear/30 bg-bear/10 text-bear',
    info: 'border-accent/30 bg-accent/10 text-accent',
    warn: 'border-amberx/30 bg-amberx/10 text-amberx',
  }
  return <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium', tones[tone])}>{children}</span>
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cn('rounded-2xl border border-line bg-card', className)}>{children}</section>
}

export function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled,
  className,
}: {
  children: ReactNode
  onClick?: () => void
  type?: 'button' | 'submit'
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
  disabled?: boolean
  className?: string
}) {
  const variants = {
    primary: 'bg-accent text-white hover:brightness-110',
    secondary: 'border border-line bg-card2 text-ink hover:border-accent/40',
    ghost: 'text-mute hover:bg-card2 hover:text-ink',
    danger: 'border border-bear/30 bg-bear/10 text-bear hover:bg-bear/15',
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' ? 'h-9 px-3 text-xs' : 'h-11 px-4 text-sm',
        variants[variant],
        className,
      )}
    >
      {children}
    </button>
  )
}

export const controlClass =
  'h-11 w-full rounded-xl border border-line bg-bg2 px-3 text-sm text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/25'

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-mute">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs leading-5 text-mute">{hint}</span>}
    </label>
  )
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: T
  options: { id: T; label: string }[]
  onChange: (id: T) => void
  ariaLabel: string
}) {
  return (
    <div className="inline-flex flex-wrap rounded-xl border border-line bg-bg2 p-1" role="group" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          className={cn(
            'rounded-lg px-2.5 py-1.5 text-xs font-medium transition',
            value === option.id ? 'bg-accent text-white' : 'text-mute hover:text-ink',
          )}
          aria-pressed={value === option.id}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export function Tooltip({ content, children }: { content: string; children: ReactNode }) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-30 hidden w-64 -translate-x-1/2 rounded-xl border border-line bg-bg2 p-3 text-xs leading-5 text-ink shadow-panel group-hover:block group-focus-within:block">
        {content}
      </span>
    </span>
  )
}

export function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean
  title: string
  children: ReactNode
  onClose: () => void
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button type="button" className="absolute inset-0 bg-[#040814]/70" aria-label="Close dialog" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label={title} className="relative z-10 w-full max-w-lg rounded-2xl border border-line bg-card p-5 shadow-panel">
        <h2 className="text-lg font-semibold">{title}</h2>
        <div className="mt-3 text-sm leading-6 text-mute">{children}</div>
      </div>
    </div>,
    document.body,
  )
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-start justify-center rounded-2xl border border-dashed border-line bg-bg2/60 px-6 py-12">
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      <p className="mt-2 max-w-xl text-sm leading-6 text-mute">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function LoadingBlock({ label = 'Loading simulated data' }: { label?: string }) {
  return (
    <div className="space-y-3" role="status" aria-live="polite">
      <div className="text-sm text-mute">{label}</div>
      <div className="h-28 animate-pulse rounded-2xl bg-card2" />
      <div className="grid gap-3 md:grid-cols-3">
        <div className="h-20 animate-pulse rounded-2xl bg-card2" />
        <div className="h-20 animate-pulse rounded-2xl bg-card2" />
        <div className="h-20 animate-pulse rounded-2xl bg-card2" />
      </div>
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-2xl border border-bear/30 bg-bear/10 p-5">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 text-bear" />
        <div>
          <h3 className="font-semibold text-ink">Could not load this view</h3>
          <p className="mt-1 text-sm leading-6 text-mute">{message}</p>
          {onRetry && (
            <div className="mt-4">
              <Button variant="secondary" onClick={onRetry}>Try again</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function Disclaimer({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-line bg-bg2/80 px-3 py-2 text-xs leading-5 text-mute">
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyanx" />
      <p>
        Educational research prototype. Simulated data and demonstration outputs are not live prices, not validated model results, and not investment advice.
        {!compact && ' Nothing on this site is a recommendation to buy or sell any instrument.'}
      </p>
    </div>
  )
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  actions?: ReactNode
}) {
  useEffect(() => {
    document.title = `${title} · MarketMind AI`
  }, [title])
  return (
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <SimulatedPill />
          <span className="text-[11px] uppercase tracking-[0.16em] text-mute">{eyebrow ?? 'Educational prototype'}</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-2 text-sm leading-6 text-mute">{subtitle}</p>}
      </div>
      {actions}
    </div>
  )
}

export function Metric({
  label,
  value,
  hint,
  tone = 'default',
}: {
  label: string
  value: string
  hint?: string
  tone?: 'default' | 'bull' | 'bear' | 'info'
}) {
  const tones = { default: 'text-ink', bull: 'text-bull', bear: 'text-bear', info: 'text-accent' }
  return (
    <div className="rounded-2xl border border-line bg-card p-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mute">{label}</div>
      <div className={cn('num mt-2 text-2xl font-medium', tones[tone])}>{value}</div>
      {hint && <div className="mt-1 text-xs leading-5 text-mute">{hint}</div>}
    </div>
  )
}

interface BoundaryState { error: Error | null }

export class ErrorBoundary extends Component<{ children: ReactNode }, BoundaryState> {
  state: BoundaryState = { error: null }
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  render() {
    if (this.state.error) {
      return (
        <ErrorState
          message={this.state.error.message || 'An unexpected interface error occurred.'}
          onRetry={() => this.setState({ error: null })}
        />
      )
    }
    return this.props.children
  }
}
