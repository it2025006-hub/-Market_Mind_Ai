import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { INSTRUMENTS } from '@/data/universe'
import { useApp } from '@/context/AppContext'
import { cn } from '@/lib/utils'

export function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const navigate = useNavigate()
  const { setSelectedSymbol, addWatch, watchlist } = useApp()
  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return INSTRUMENTS.filter((item) => !q || `${item.symbol} ${item.name} ${item.exchange} ${item.sector}`.toLowerCase().includes(q)).slice(0, 8)
  }, [query])

  useEffect(() => {
    if (!open) return
    setQuery('')
    setActive(0)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setActive((value) => Math.min(results.length - 1, value + 1))
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setActive((value) => Math.max(0, value - 1))
      }
      if (event.key === 'Enter' && results[active]) {
        setSelectedSymbol(results[active].symbol)
        navigate('/app')
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, results, active, navigate, onClose, setSelectedSymbol])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[12vh]">
      <button type="button" className="absolute inset-0 bg-[#040814]/70" aria-label="Close search" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label="Search instruments" className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-card shadow-panel">
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search className="h-4 w-4 text-mute" />
          <input
            autoFocus
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setActive(0)
            }}
            placeholder="Search symbol, name, exchange or sector"
            className="h-14 w-full bg-transparent text-sm outline-none"
          />
        </div>
        <ul className="max-h-80 overflow-auto p-2">
          {results.length === 0 && <li className="px-3 py-6 text-sm text-mute">No instruments match that search.</li>}
          {results.map((item, index) => (
            <li key={item.symbol}>
              <div className={cn('flex items-center justify-between gap-3 rounded-xl px-3 py-3', index === active ? 'bg-card2' : '')}>
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => {
                    setSelectedSymbol(item.symbol)
                    navigate('/app')
                    onClose()
                  }}
                >
                  <div className="text-sm font-medium">{item.symbol}</div>
                  <div className="truncate text-xs text-mute">{item.name} · {item.exchange} · {item.sector}</div>
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-line px-2 py-1 text-[11px] text-mute hover:text-ink"
                  onClick={() => addWatch(item.symbol)}
                  disabled={watchlist.includes(item.symbol)}
                >
                  {watchlist.includes(item.symbol) ? 'Watching' : 'Watch'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
