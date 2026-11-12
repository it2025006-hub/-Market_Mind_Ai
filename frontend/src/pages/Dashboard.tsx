import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { RefreshCw, X } from 'lucide-react'
import { CandleChart, MacdChart, RsiChart, type VisibleRange } from '@/components/charts/CandleChart'
import { Sparkline } from '@/components/charts/Widgets'
import { Badge, Button, Card, Disclaimer, ErrorState, LoadingBlock, PageHeader, Segmented, controlClass } from '@/components/ui'
import { useApp } from '@/context/AppContext'
import { FEATURED_SYMBOLS, INSTRUMENTS, TIMEFRAMES, type Timeframe, getInstrument } from '@/data/universe'
import { formatCompact, formatDateTime, formatPct, money, signedClass } from '@/lib/format'
import { atr, lastNumber, rsi } from '@/lib/indicators'
import { cn } from '@/lib/utils'
import { useLoad } from '@/hooks/useLoad'
import { loadCandles, loadQuotes } from '@/services/api'

export function Dashboard() {
  const { settings, selectedSymbol, setSelectedSymbol, refreshNonce, refreshData, watchlist, removeWatch, updateSettings } = useApp()
  const [timeframe, setTimeframe] = useState<Timeframe>('1d')
  const [showMA, setShowMA] = useState(true)
  const [showBB, setShowBB] = useState(false)
  const [showVolume, setShowVolume] = useState(true)
  const [showRsi, setShowRsi] = useState(true)
  const [showMacd, setShowMacd] = useState(false)
  const [range, setRange] = useState<VisibleRange | null>(null)
  const onRange = useCallback((next: VisibleRange) => setRange(next), [])

  const quotes = useLoad(() => loadQuotes(settings, [...FEATURED_SYMBOLS], refreshNonce), [settings.apiMode, settings.apiBaseUrl, refreshNonce])
  const candles = useLoad(() => loadCandles(settings, selectedSymbol, timeframe, refreshNonce), [settings.apiMode, settings.apiBaseUrl, selectedSymbol, timeframe, refreshNonce])
  const instrument = getInstrument(selectedSymbol)
  const selectedQuote = quotes.data?.find((item) => item.symbol === selectedSymbol)
  const indicatorSnap = useMemo(() => {
    if (!candles.data) return null
    const closes = candles.data.map((c) => c.close)
    return {
      rsi: lastNumber(rsi(closes, 14)),
      atr: lastNumber(atr(candles.data, 14)),
    }
  }, [candles.data])

  return (
    <div>
      <PageHeader
        eyebrow="Market overview"
        title="Dashboard"
        subtitle="A simulated multi-asset desk. Cards, candles and indicators are computed in the prototype and labelled as such."
        actions={
          <Button variant="secondary" onClick={refreshData}>
            <RefreshCw className="h-4 w-4" /> Refresh snapshot
          </Button>
        }
      />
      {!settings.coachDismissed && (
        <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-accent/30 bg-accent/10 p-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm leading-6">Guided path: open AI Prediction, keep RELIANCE selected, run the demonstration fusion, then inspect contributions, regime and risk.</p>
          <div className="flex gap-2">
            <Link to="/app/predict" className="inline-flex h-9 items-center rounded-xl bg-accent px-3 text-xs font-medium text-white">Start with RELIANCE</Link>
            <Button size="sm" variant="ghost" onClick={() => updateSettings({ coachDismissed: true })}>Dismiss</Button>
          </div>
        </div>
      )}
      <div className="mb-5"><Disclaimer compact /></div>
      {quotes.loading && <LoadingBlock label="Preparing simulated quotes" />}
      {quotes.error && <ErrorState message={quotes.error} onRetry={quotes.retry} />}
      {quotes.data && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {quotes.data.map((quote) => (
            <button
              key={quote.symbol}
              type="button"
              onClick={() => { setSelectedSymbol(quote.symbol); setRange(null) }}
              className={cn('rounded-2xl border bg-card p-4 text-left transition hover:border-accent/40', selectedSymbol === quote.symbol ? 'border-accent' : 'border-line')}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{quote.symbol}</span>
                    <Badge>Simulated</Badge>
                  </div>
                  <div className="mt-1 text-xs text-mute">{quote.name} · {quote.exchange}</div>
                </div>
                <Sparkline data={quote.spark} positive={quote.change >= 0} />
              </div>
              <div className="mt-4 flex items-end justify-between">
                <div className="num text-2xl">{money(quote.price, quote.currency)}</div>
                <div className={cn('num text-sm', signedClass(quote.changePct))}>{formatPct(quote.changePct)}</div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-mute">
                <span>High {money(quote.high, quote.currency)}</span>
                <span>Low {money(quote.low, quote.currency)}</span>
                <span>Status simulated</span>
                <span>{formatDateTime(quote.timestamp)}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="p-4 md:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-lg font-semibold">{instrument.name}</div>
              <div className="text-xs text-mute">{instrument.exchange} · {instrument.sector} · simulation anchor is not a quote</div>
            </div>
            <div className="flex flex-wrap gap-2">
              <select className={cn(controlClass, 'w-auto')} value={selectedSymbol} onChange={(e) => { setSelectedSymbol(e.target.value); setRange(null) }} aria-label="Select instrument">
                {INSTRUMENTS.map((item) => <option key={item.symbol} value={item.symbol}>{item.symbol} · {item.name}</option>)}
              </select>
              <Segmented ariaLabel="Chart timeframe" value={timeframe} onChange={(id) => { setTimeframe(id); setRange(null) }} options={TIMEFRAMES.map((item) => ({ id: item.id, label: item.label }))} />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              ['Volume', showVolume, () => setShowVolume((v) => !v)],
              ['MA 20/50', showMA, () => setShowMA((v) => !v)],
              ['Bollinger', showBB, () => setShowBB((v) => !v)],
              ['RSI', showRsi, () => setShowRsi((v) => !v)],
              ['MACD', showMacd, () => setShowMacd((v) => !v)],
            ].map(([label, on, toggle]) => (
              <button key={String(label)} type="button" onClick={toggle as () => void} className={cn('rounded-full border px-3 py-1 text-xs', on ? 'border-accent bg-accent/10 text-accent' : 'border-line text-mute')} aria-pressed={Boolean(on)}>
                {label as string}
              </button>
            ))}
          </div>
          <div className="mt-4">
            {candles.loading && <LoadingBlock label="Building simulated candles" />}
            {candles.error && <ErrorState message={candles.error} onRetry={candles.retry} />}
            {candles.data && (
              <>
                <CandleChart candles={candles.data} theme={settings.theme} showVolume={showVolume} showMA={showMA} showBB={showBB} logicalRange={range} onLogicalRangeChange={onRange} />
                {showRsi && (
                  <div className="mt-3">
                    <div className="mb-1 text-[11px] uppercase tracking-[0.14em] text-mute">RSI 14</div>
                    <RsiChart candles={candles.data} theme={settings.theme} logicalRange={range} onLogicalRangeChange={onRange} />
                  </div>
                )}
                {showMacd && (
                  <div className="mt-3">
                    <div className="mb-1 text-[11px] uppercase tracking-[0.14em] text-mute">MACD 12, 26, 9</div>
                    <MacdChart candles={candles.data} theme={settings.theme} logicalRange={range} onLogicalRangeChange={onRange} />
                  </div>
                )}
                <div className="mt-3 text-xs text-mute">
                  Data freshness: simulated snapshot {candles.data.length ? formatDateTime(candles.data[candles.data.length - 1].time * 1000) : '—'} · not a live feed
                </div>
              </>
            )}
          </div>
        </Card>
        <div className="space-y-4">
          <Card className="p-4">
            <div className="text-[11px] uppercase tracking-[0.14em] text-mute">Selected instrument</div>
            <div className="mt-2 text-xl font-semibold">{selectedSymbol}</div>
            {selectedQuote ? (
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-mute">Last</span><span className="num">{money(selectedQuote.price, selectedQuote.currency)}</span></div>
                <div className="flex justify-between"><span className="text-mute">Change</span><span className={cn('num', signedClass(selectedQuote.changePct))}>{formatPct(selectedQuote.changePct)}</span></div>
                <div className="flex justify-between"><span className="text-mute">Volume</span><span className="num">{formatCompact(selectedQuote.volume)}</span></div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-mute">This symbol is outside the six overview cards. Open the chart to inspect its simulated path.</p>
            )}
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-xl bg-bg2 p-3"><div className="text-[11px] text-mute">RSI</div><div className="num mt-1">{indicatorSnap?.rsi?.toFixed(1) ?? '—'}</div></div>
              <div className="rounded-xl bg-bg2 p-3"><div className="text-[11px] text-mute">ATR</div><div className="num mt-1">{indicatorSnap?.atr ? money(indicatorSnap.atr, instrument.currency) : '—'}</div></div>
            </div>
            <Link to="/app/predict" className="mt-4 inline-flex text-sm font-medium text-accent">Run a demo prediction</Link>
          </Card>
          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="font-semibold">Watchlist</div>
              <span className="text-[11px] text-mute">Saved in this browser</span>
            </div>
            <div className="space-y-2">
              {watchlist.map((symbol) => {
                const item = INSTRUMENTS.find((inst) => inst.symbol === symbol)
                return (
                  <div key={symbol} className="flex items-center justify-between gap-2 rounded-xl bg-bg2 px-3 py-2">
                    <button type="button" className="min-w-0 text-left" onClick={() => setSelectedSymbol(symbol)}>
                      <div className="text-sm font-medium">{symbol}</div>
                      <div className="truncate text-[11px] text-mute">{item?.name}</div>
                    </button>
                    <button type="button" aria-label={`Remove ${symbol}`} onClick={() => removeWatch(symbol)} className="rounded-lg p-1 text-mute hover:text-ink">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )
              })}
            </div>
            <p className="mt-3 text-xs leading-5 text-mute">Search with / to add another symbol. Removing an item only changes this browser.</p>
          </Card>
        </div>
      </div>
    </div>
  )
}
