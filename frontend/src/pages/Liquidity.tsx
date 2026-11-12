import { useMemo, useState } from 'react'
import { CandleChart } from '@/components/charts/CandleChart'
import { Badge, Card, Disclaimer, Field, PageHeader, Segmented, controlClass } from '@/components/ui'
import { useApp } from '@/context/AppContext'
import { INSTRUMENTS, type Timeframe } from '@/data/universe'
import { formatDateTime, formatPct, money } from '@/lib/format'
import { markerFor, scanLiquidity, type ScanType } from '@/lib/liquidity'
import { generateSeries } from '@/lib/marketSim'
import { cn } from '@/lib/utils'

const TYPES: Array<ScanType | 'all'> = ['all', 'swing-high', 'swing-low', 'volume-spike', 'breakout', 'failed-breakout']

export function Liquidity() {
  const { settings, selectedSymbol, setSelectedSymbol, refreshNonce } = useApp()
  const symbol = selectedSymbol
  const [timeframe, setTimeframe] = useState<Timeframe>('1d')
  const [swing, setSwing] = useState(5)
  const [filter, setFilter] = useState<ScanType | 'all'>('all')
  const [selectedTime, setSelectedTime] = useState<number | null>(null)
  const scan = useMemo(() => scanLiquidity(symbol, timeframe, refreshNonce, swing), [symbol, timeframe, refreshNonce, swing])
  const candles = useMemo(() => generateSeries(symbol, timeframe, refreshNonce), [symbol, timeframe, refreshNonce])
  const instrument = INSTRUMENTS.find((item) => item.symbol === symbol)!
  const visible = scan.events.filter((event) => filter === 'all' || event.type === filter)
  const markers = visible.slice(0, 14).map((event) => ({ time: event.time, text: event.label.split(' ')[0], ...markerFor(event.type) }))
  const priceLines = [
    ...scan.zones.map((zone) => ({
      price: zone.price,
      title: `${zone.kind === 'supply' ? 'Est. supply' : 'Est. demand'} ×${zone.touches}`,
      color: zone.kind === 'supply' ? '#EA3943' : '#16C784',
    })),
    ...(selectedTime ? [{ price: visible.find((event) => event.time === selectedTime)?.price ?? scan.zones[0]?.price ?? 0, title: 'Selected', color: '#22D3EE' }] : []),
  ].filter((line) => line.price > 0)

  return (
    <div>
      <PageHeader
        eyebrow="Market structure"
        title="Liquidity and Volatility Scanner"
        subtitle="Swing points, clustered zones, volume spikes and range breaks on simulated prices. Zones are algorithmic estimates, not confirmed stop-loss orders."
      />
      <div className="mb-5"><Disclaimer /></div>
      <Card className="mb-4 grid gap-3 p-4 md:grid-cols-4">
        <Field label="Instrument">
          <select className={controlClass} value={symbol} onChange={(e) => { setSelectedSymbol(e.target.value); setSelectedTime(null) }}>
            {INSTRUMENTS.map((item) => <option key={item.symbol} value={item.symbol}>{item.symbol}</option>)}
          </select>
        </Field>
        <Field label="Timeframe">
          <select className={controlClass} value={timeframe} onChange={(e) => setTimeframe(e.target.value as Timeframe)}>
            <option value="1d">1D</option><option value="4h">4H</option><option value="1h">1H</option><option value="15m">15m</option>
          </select>
        </Field>
        <Field label="Swing lookback">
          <select className={controlClass} value={swing} onChange={(e) => setSwing(Number(e.target.value))}>
            <option value={3}>3 bars</option><option value={5}>5 bars</option><option value={8}>8 bars</option>
          </select>
        </Field>
        <div className="flex items-end"><Segmented ariaLabel="Event filter" value={filter} onChange={setFilter} options={TYPES.map((id) => ({ id, label: id === 'all' ? 'All' : id.split('-')[0] }))} /></div>
      </Card>
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4"><div className="text-[11px] uppercase tracking-wider text-mute">Volatility class</div><div className="mt-2 font-semibold">{scan.volatilityClass}</div></Card>
        <Card className="p-4"><div className="text-[11px] uppercase tracking-wider text-mute">ATR</div><div className="num mt-2 text-xl">{money(scan.atr, instrument.currency)}</div><div className="text-xs text-mute">{formatPct(scan.atrPercent * 100, 2)} of price</div></Card>
        <Card className="p-4"><div className="text-[11px] uppercase tracking-wider text-mute">Estimated zones</div><div className="num mt-2 text-xl">{scan.zones.length}</div></Card>
        <Card className="p-4"><div className="text-[11px] uppercase tracking-wider text-mute">Events in view</div><div className="num mt-2 text-xl">{visible.length}</div></Card>
      </div>
      {(scan.volatilityClass === 'High volatility' || scan.volatilityClass === 'Extreme volatility') && (
        <div className="mb-4 rounded-2xl border border-amberx/40 bg-amberx/10 px-4 py-3 text-sm">Volatility is elevated on this simulated path. Treat pattern estimates with extra caution.</div>
      )}
      <Card className="p-4">
        <CandleChart candles={candles} theme={settings.theme} showMA={false} markers={markers} priceLines={priceLines} height={440} />
        <p className="mt-3 text-xs leading-5 text-mute">{scan.disclaimer}</p>
      </Card>
      <div className="mt-4 grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Card className="p-4">
          <h3 className="font-semibold">Estimated zones</h3>
          <div className="mt-3 space-y-2">
            {scan.zones.length === 0 && <p className="text-sm text-mute">No cluster of two or more recent swings within 0.4%.</p>}
            {scan.zones.map((zone) => (
              <button key={zone.id} type="button" onClick={() => setSelectedTime(null)} className="block w-full rounded-xl bg-bg2 px-3 py-2 text-left">
                <div className="flex items-center justify-between text-sm"><span className="capitalize">{zone.kind}</span><Badge>{zone.touches} touches</Badge></div>
                <div className="num mt-1">{money(zone.price, instrument.currency)}</div>
                <p className="mt-1 text-[11px] leading-4 text-mute">{zone.note}</p>
              </button>
            ))}
          </div>
        </Card>
        <Card className="overflow-x-auto p-4">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-mute">
              <tr><th className="py-2">Time</th><th>Event</th><th>Price</th><th>Note</th></tr>
            </thead>
            <tbody>
              {visible.map((event) => (
                <tr key={event.id} onClick={() => setSelectedTime(event.time)} className={cn('cursor-pointer border-t border-line', selectedTime === event.time && 'bg-accent/10')}>
                  <td className="py-3 pr-3 text-mute">{formatDateTime(event.time * 1000)}</td>
                  <td className="py-3 pr-3">{event.label}</td>
                  <td className="num py-3 pr-3">{money(event.price, instrument.currency)}</td>
                  <td className="py-3 text-xs leading-5 text-mute">{event.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  )
}
