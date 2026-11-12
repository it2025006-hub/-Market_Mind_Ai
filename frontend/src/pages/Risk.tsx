import { useEffect, useMemo, useState } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, Disclaimer, Field, Metric, PageHeader, controlClass } from '@/components/ui'
import { useApp } from '@/context/AppContext'
import { INSTRUMENTS, getInstrument } from '@/data/universe'
import { formatDay, formatPct, money } from '@/lib/format'
import { generateSeries } from '@/lib/marketSim'
import { detectRegime, volatilityClass } from '@/lib/analysis'
import { positionSize, riskStats } from '@/lib/risk'

export function Risk() {
  const { selectedSymbol, setSelectedSymbol, refreshNonce } = useApp()
  const symbol = selectedSymbol
  const [balance, setBalance] = useState('100000')
  const [riskPct, setRiskPct] = useState('1')
  const [entry, setEntry] = useState('')
  const [stop, setStop] = useState('')
  const [target, setTarget] = useState('')
  const [touched, setTouched] = useState(false)
  const instrument = getInstrument(symbol)
  const candles = useMemo(() => generateSeries(symbol, '1d', refreshNonce), [symbol, refreshNonce])
  const stats = useMemo(() => riskStats(candles), [candles])
  const regime = useMemo(() => detectRegime(symbol, '1d', refreshNonce), [symbol, refreshNonce])
  const volClass = volatilityClass(regime.features.atrPercentile)
  const price = candles[candles.length - 1]?.close ?? instrument.basePrice

  useEffect(() => {
    if (!touched) setEntry(price.toFixed(2))
  }, [price, touched, symbol])

  const parsedTarget = target.trim() === '' ? null : Number(target)
  const result = positionSize({
    balance: Number(balance),
    riskPct: Number(riskPct),
    entry: Number(entry),
    stop: Number(stop),
    target: parsedTarget,
  })
  const highVol = volClass === 'High volatility' || volClass === 'Extreme volatility'

  return (
    <div>
      <PageHeader
        eyebrow="Educational estimates"
        title="Risk Assessment"
        subtitle="Volatility, drawdown, historical VaR and a position-size calculator on the simulated daily path. Not personalised investment advice."
      />
      <div className="mb-5"><Disclaimer /></div>
      {highVol && (
        <div className="mb-4 rounded-2xl border border-bear/40 bg-bear/10 px-4 py-3 text-sm">
          Volatility classification on this simulated path is {volClass.toLowerCase()}. An educational example should use a smaller risk percentage or a wider stop.
        </div>
      )}
      <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card className="space-y-4 p-5">
          <Field label="Instrument">
            <select className={controlClass} value={symbol} onChange={(e) => { setSelectedSymbol(e.target.value); setTouched(false); setStop(''); setTarget('') }}>
              {INSTRUMENTS.map((item) => <option key={item.symbol} value={item.symbol}>{item.symbol} · {item.name}</option>)}
            </select>
          </Field>
          <Field label="Account balance" hint={`Illustrative units in ${instrument.currency}. Not a brokerage balance.`}>
            <input className={controlClass} inputMode="decimal" value={balance} onChange={(e) => setBalance(e.target.value)} />
          </Field>
          <Field label="Risk percentage">
            <input className={controlClass} inputMode="decimal" value={riskPct} onChange={(e) => setRiskPct(e.target.value)} />
          </Field>
          <Field label="Entry price">
            <input className={controlClass} inputMode="decimal" value={entry} onChange={(e) => { setTouched(true); setEntry(e.target.value) }} />
          </Field>
          <button type="button" className="text-xs text-accent" onClick={() => { setTouched(false); setEntry(price.toFixed(2)) }}>Use simulated last price</button>
          <Field label="Stop-loss price">
            <input className={controlClass} inputMode="decimal" value={stop} onChange={(e) => setStop(e.target.value)} placeholder="Required" />
          </Field>
          <Field label="Target price" hint="Optional. Used only for a reward-to-risk illustration.">
            <input className={controlClass} inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="Optional" />
          </Field>
        </Card>
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Historical volatility" value={formatPct(stats.hvAnnualized * 100, 1)} hint="Annualised from simulated daily log returns" />
            <Metric label="Max drawdown" value={formatPct(stats.maxDrawdown * 100, 1)} tone="bear" hint="Peak to trough on the simulated path" />
            <Metric label="VaR 95%" value={formatPct(stats.var95 * 100, 2)} tone="bear" hint="5th percentile of simulated daily log returns" />
            <Metric label="CVaR 95%" value={formatPct(stats.cvar95 * 100, 2)} tone="bear" hint="Mean of simulated returns at or below VaR" />
          </div>
          <Card className="p-5">
            <h3 className="font-semibold">Position-size illustration</h3>
            {stop.trim() === '' && <p className="mt-3 text-sm text-mute">Enter a stop-loss to calculate an educational position size. A stop below entry is treated as a long example; a stop above entry is treated as a short example.</p>}
            {stop.trim() !== '' && !result.ok && (
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-bear">
                {result.errors.map((error) => <li key={error}>{error}</li>)}
              </ul>
            )}
            {stop.trim() !== '' && result.ok && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-bg2 p-4">
                  <div className="text-[11px] uppercase tracking-wider text-mute">Suggested units</div>
                  <div className="num mt-1 text-3xl">{result.units}</div>
                  <div className="mt-1 text-xs text-mute">{result.side} example · floor of risk budget / stop distance</div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-mute">Risk amount</span><span className="num">{money(result.riskAmount, instrument.currency)}</span></div>
                  <div className="flex justify-between"><span className="text-mute">Per unit at stop</span><span className="num">{money(result.perUnit, instrument.currency)}</span></div>
                  <div className="flex justify-between"><span className="text-mute">Notional</span><span className="num">{money(result.notional, instrument.currency)}</span></div>
                  <div className="flex justify-between"><span className="text-mute">Loss at stop</span><span className="num">{money(result.lossAtStop, instrument.currency)}</span></div>
                  {result.gainAtTarget != null && <div className="flex justify-between"><span className="text-mute">Gain at target</span><span className="num">{money(result.gainAtTarget, instrument.currency)}</span></div>}
                  {result.rewardRisk != null && <div className="flex justify-between"><span className="text-mute">Reward / risk</span><span className="num">{result.rewardRisk.toFixed(2)}</span></div>}
                </div>
                {result.warnings.length > 0 && (
                  <div className="sm:col-span-2 rounded-xl border border-amberx/30 bg-amberx/10 p-3 text-sm leading-6">{result.warnings.join(' ')}</div>
                )}
              </div>
            )}
            <p className="mt-4 text-xs leading-5 text-mute">Units = floor(balance × risk% / |entry − stop|). This is an educational estimate. It does not place an order and ignores lot size, margin and costs unless you account for them yourself.</p>
          </Card>
          <Card className="p-5">
            <h3 className="font-semibold">Underwater curve</h3>
            <p className="text-xs text-mute">Drawdown of the simulated close series. Not a strategy equity curve.</p>
            <div className="mt-3 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.underwater.map((point) => ({ day: formatDay(point.time * 1000), drawdown: Number(point.drawdown.toFixed(2)) }))}>
                  <CartesianGrid stroke="rgba(148,163,184,0.15)" vertical={false} />
                  <XAxis dataKey="day" stroke="#94A3B8" fontSize={11} minTickGap={28} />
                  <YAxis stroke="#94A3B8" fontSize={11} />
                  <Tooltip />
                  <Area type="monotone" dataKey="drawdown" stroke="#EA3943" fill="rgba(234,57,67,0.2)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
