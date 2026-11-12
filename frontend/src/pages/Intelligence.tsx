import { useMemo } from 'react'
import { Card, Disclaimer, Field, PageHeader, controlClass } from '@/components/ui'
import { useApp } from '@/context/AppContext'
import { INSTRUMENTS, getInstrument } from '@/data/universe'
import { REGIME_LABEL, REGIME_ORDER, REGIME_WEIGHTS, detectRegime, runAnalysis, type RegimeId } from '@/lib/analysis'
import { formatDateTime, formatPct } from '@/lib/format'
import { cn } from '@/lib/utils'

const COLORS: Record<RegimeId, string> = {
  bull: '#16C784',
  bear: '#EA3943',
  sideways: '#94A3B8',
  high_vol: '#F5B942',
  low_vol: '#22D3EE',
}

export function Intelligence() {
  const { selectedSymbol, setSelectedSymbol, refreshNonce } = useApp()
  const symbol = selectedSymbol
  const regime = useMemo(() => detectRegime(symbol, '1d', refreshNonce, 400), [symbol, refreshNonce])
  const analysis = useMemo(() => runAnalysis({ symbol, timeframe: '1d', horizon: 'next_session', nonce: refreshNonce, bars: 250 }), [symbol, refreshNonce])
  const instrument = getInstrument(symbol)

  return (
    <div>
      <PageHeader
        eyebrow="Regime engine"
        title="Market Intelligence"
        subtitle="Classifies the simulated path and shows how the demonstration policy would reweight signals. Not validated on labelled regimes."
      />
      <div className="mb-5"><Disclaimer /></div>
      <Card className="mb-5 p-4 md:max-w-sm">
        <Field label="Instrument" hint="Regime features are computed on the simulated daily path.">
          <select className={controlClass} value={symbol} onChange={(e) => setSelectedSymbol(e.target.value)}>
            {INSTRUMENTS.map((item) => <option key={item.symbol} value={item.symbol}>{item.symbol} · {item.name}</option>)}
          </select>
        </Field>
      </Card>
      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-5">
          <div className="text-[11px] uppercase tracking-[0.14em] text-mute">{instrument.name}</div>
          <h2 className="mt-2 text-3xl font-semibold">{regime.label}</h2>
          <p className="mt-2 text-sm leading-6 text-mute">{regime.disclaimer}</p>
          <div className="mt-5 space-y-3">
            {REGIME_ORDER.map((id) => (
              <div key={id}>
                <div className="mb-1 flex justify-between text-xs"><span>{REGIME_LABEL[id]}</span><span className="num">{formatPct(regime.probabilities[id] * 100, 1)}</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-card2">
                  <div className="h-full" style={{ width: `${regime.probabilities[id] * 100}%`, background: COLORS[id] }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold">Features used</h3>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            {[
              ['ATR percentile', formatPct(regime.features.atrPercentile * 100, 0)],
              ['Ann. volatility', formatPct(regime.features.hvAnnualized * 100, 1)],
              ['MA slope', regime.features.maSlope.toFixed(4)],
              ['20-bar return', formatPct(regime.features.return20 * 100, 2)],
              ['Volume z-score', regime.features.volumeZ.toFixed(2)],
              ['As of', formatDateTime(analysis.dataAsOf)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-bg2 p-3">
                <div className="text-[11px] uppercase tracking-wider text-mute">{label}</div>
                <div className="num mt-1">{value}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-5 p-5">
        <h3 className="font-semibold">Historical regime ribbon</h3>
        <p className="mt-1 text-xs leading-5 text-mute">Downsampled labels along the simulated path. A colour change is an estimate, not a confirmed regime break.</p>
        <div className="mt-4 flex h-8 overflow-hidden rounded-lg">
          {regime.history.map((point) => (
            <div key={point.time} title={`${REGIME_LABEL[point.id]} · ${formatDateTime(point.time * 1000)}`} className="h-full flex-1" style={{ background: COLORS[point.id] }} />
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-mute">
          {REGIME_ORDER.map((id) => (
            <span key={id} className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: COLORS[id] }} />{REGIME_LABEL[id]}</span>
          ))}
        </div>
      </Card>

      <Card className="mt-5 overflow-x-auto p-5">
        <h3 className="font-semibold">Signal importance under each regime</h3>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-mute">These weights are the demonstration policy. In a high-volatility state the policy reduces momentum and increases the volatility signal. They are design choices, not learned coefficients, and not evidence of accuracy.</p>
        <table className="mt-4 w-full min-w-[680px] text-left text-sm">
          <thead className="text-[11px] uppercase tracking-wider text-mute">
            <tr>
              <th className="py-2">Signal</th>
              {REGIME_ORDER.map((id) => <th key={id} className={cn('py-2', id === regime.id && 'text-accent')}>{REGIME_LABEL[id]}</th>)}
            </tr>
          </thead>
          <tbody>
            {(['momentum', 'sentiment', 'volatility', 'cross', 'volume'] as const).map((signal) => (
              <tr key={signal} className="border-t border-line">
                <td className="py-3 capitalize">{signal === 'cross' ? 'Cross-market' : signal}</td>
                {REGIME_ORDER.map((id) => (
                  <td key={id} className={cn('num py-3', id === regime.id && 'text-accent')}>{REGIME_WEIGHTS[id][signal].toFixed(2)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <h3 className="font-semibold">Equal weight vs adaptive policy</h3>
          <p className="mt-2 text-sm leading-6 text-mute">Same simulated signals, two demonstration policies. A difference shows the method, not that one policy forecasts better.</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-bg2 p-3"><div className="text-[11px] text-mute">Equal weight</div><div className="mt-1 font-semibold">{analysis.equalWeightDirection}</div><div className="num text-xs text-mute">{analysis.equalWeightScore.toFixed(3)}</div></div>
            <div className="rounded-xl bg-bg2 p-3"><div className="text-[11px] text-mute">Regime adaptive</div><div className="mt-1 font-semibold">{analysis.direction}</div><div className="num text-xs text-mute">{analysis.score.toFixed(3)}</div></div>
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold">What this page does not claim</h3>
          <p className="mt-2 text-sm leading-6 text-mute">Regime detection has not been tested on a labelled historical set. Probabilities are a softmax over heuristic scores. They should not be read as calibrated regime probabilities.</p>
        </Card>
      </div>
    </div>
  )
}
