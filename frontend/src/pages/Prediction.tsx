import { useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Play } from 'lucide-react'
import { ContributionBars, Gauge, Meter } from '@/components/charts/Widgets'
import { Badge, Button, Card, Disclaimer, EmptyState, Field, PageHeader, Segmented, Tooltip, controlClass } from '@/components/ui'
import { useApp } from '@/context/AppContext'
import { EXCHANGES, INSTRUMENTS, TIMEFRAMES, type Timeframe, getInstrument } from '@/data/universe'
import { HORIZONS, REGIME_LABEL, REGIME_ORDER, REGIME_WEIGHTS, type Analysis, type HorizonId } from '@/lib/analysis'
import { formatDateTime, formatPct, money } from '@/lib/format'
import { loadPrediction } from '@/services/api'

const LOOKBACKS = [120, 250, 400]

export function Prediction() {
  const { settings, selectedSymbol, setSelectedSymbol, refreshNonce, addPrediction, toast, pushNotification } = useApp()
  const location = useLocation()
  const restored = (location.state as { analysis?: Analysis } | null)?.analysis ?? null
  const exchange = getInstrument(selectedSymbol).exchange
  const [horizon, setHorizon] = useState<HorizonId>('next_session')
  const [timeframe, setTimeframe] = useState<Timeframe>('1d')
  const [bars, setBars] = useState(250)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<Analysis | null>(restored)
  const symbols = useMemo(() => INSTRUMENTS.filter((item) => item.exchange === exchange), [exchange])
  const exchangeOptions = EXCHANGES

  const run = async () => {
    setRunning(true)
    setError(null)
    try {
      if (settings.apiMode === 'demo') await new Promise((resolve) => window.setTimeout(resolve, 420))
      const analysis = await loadPrediction(settings, { symbol: selectedSymbol, timeframe, horizon, nonce: refreshNonce, bars })
      setResult(analysis)
      addPrediction(analysis)
      toast('Simulated prediction saved to history', 'success')
      pushNotification({
        title: 'Demonstration run saved',
        body: `${analysis.symbol} ${analysis.direction} was stored as a simulated run. Outcome is not evaluated.`,
        tone: 'info',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Prediction failed')
    } finally {
      setRunning(false)
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Prediction engine"
        title="AI Stock Prediction"
        subtitle="Run the transparent demonstration fusion engine. Random Forest, XGBoost, LSTM and GRU slots are specified but not loaded."
      />
      <div className="mb-5"><Disclaimer /></div>
      <Card className="p-4 md:p-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <Field label="Exchange">
            <select className={controlClass} value={exchange} onChange={(e) => {
              const first = INSTRUMENTS.find((item) => item.exchange === e.target.value)
              if (first) setSelectedSymbol(first.symbol)
            }}>
              {exchangeOptions.map((item) => <option key={item}>{item}</option>)}
            </select>
          </Field>
          <Field label="Symbol">
            <select className={controlClass} value={selectedSymbol} onChange={(e) => setSelectedSymbol(e.target.value)}>
              {symbols.map((item) => (
                <option key={item.symbol} value={item.symbol}>{item.symbol} · {item.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Horizon">
            <select className={controlClass} value={horizon} onChange={(e) => setHorizon(e.target.value as HorizonId)}>
              {HORIZONS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </Field>
          <Field label="Timeframe">
            <select className={controlClass} value={timeframe} onChange={(e) => setTimeframe(e.target.value as Timeframe)}>
              {TIMEFRAMES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </Field>
          <Field label="Lookback">
            <select className={controlClass} value={bars} onChange={(e) => setBars(Number(e.target.value))}>
              {LOOKBACKS.map((item) => <option key={item} value={item}>{item} bars</option>)}
            </select>
          </Field>
          <div className="flex items-end">
            <Button className="w-full" onClick={run} disabled={running}>
              <Play className="h-4 w-4" /> {running ? 'Computing' : 'Run demo prediction'}
            </Button>
          </div>
        </div>
        {error && <p className="mt-3 text-sm text-bear">{error}</p>}
      </Card>

      {!result && (
        <div className="mt-5">
          <EmptyState
            title="No demonstration run yet"
            body="Choose an instrument and horizon, then run the fusion engine. The result will show direction, a separate confidence score, an uncertainty band, the detected regime and additive contributions. It will be saved as simulated, with no evaluated outcome."
          />
        </div>
      )}

      {result && (
        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-5">
            <Card className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-sm text-mute">{result.name} · {result.exchange}</div>
                  <h2 className="mt-1 text-3xl font-semibold">{result.direction}</h2>
                  <p className="mt-1 text-sm text-mute">{result.horizonLabel} · {result.timeframe} · demonstration fusion</p>
                </div>
                <Badge tone={result.direction === 'BULLISH' ? 'bull' : result.direction === 'BEARISH' ? 'bear' : 'warn'}>Illustrative</Badge>
              </div>
              <div className="mt-4 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
                <Gauge value={result.bullishProbability * 100} caption="Bullish probability" />
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-bg2 p-3">
                      <div className="text-[11px] uppercase tracking-wider text-mute">Illustrative bullish probability</div>
                      <div className="num mt-1 text-2xl text-bull">{formatPct(result.bullishProbability * 100, 1)}</div>
                    </div>
                    <div className="rounded-xl bg-bg2 p-3">
                      <div className="text-[11px] uppercase tracking-wider text-mute">Illustrative bearish probability</div>
                      <div className="num mt-1 text-2xl text-bear">{formatPct(result.bearishProbability * 100, 1)}</div>
                    </div>
                  </div>
                  <Meter label="Model confidence" value={result.confidence} hint="Separate from probability. Lower when signals disagree or volatility is elevated." />
                  <Meter label="Uncertainty" value={result.uncertainty} hint="Widens the expected range. It is not a statistical confidence interval from a fitted model." />
                  <div className="text-sm text-mute">
                    Expected range {money(result.expectedLow, result.currency)} – {money(result.expectedHigh, result.currency)} · last simulated price {money(result.price, result.currency)}
                  </div>
                </div>
              </div>
            </Card>
            <Card className="p-5">
              <div className="mb-1 flex items-center gap-2">
                <h3 className="font-semibold">Why this output</h3>
                <Tooltip content="These bars are weight × signal for the demonstration engine. They use a SHAP-compatible additive layout. They are not SHAP values from a fitted model, and they are not proof of causation.">
                  <button type="button" className="text-xs text-accent" aria-label="Explanation note">What this means</button>
                </Tooltip>
              </div>
              <p className="mb-4 text-xs leading-5 text-mute">Positive bars support the bullish score. Negative bars reduce it. Feature importance here is not causation.</p>
              <ContributionBars items={result.signals.map((signal) => ({ name: signal.label, value: signal.contribution }))} />
              <div className="mt-5 space-y-3">
                {result.narrative.map((line) => <p key={line} className="text-sm leading-6 text-mute">{line}</p>)}
              </div>
              <details className="mt-4 rounded-xl bg-bg2 p-4 text-sm">
                <summary className="cursor-pointer font-medium">Show calculation</summary>
                <p className="mt-3 num text-xs leading-6 text-mute">
                  score = Σ weight × signal = {result.formula.score.toFixed(3)}<br />
                  p(bull) = 1 / (1 + exp(-{result.formula.k} × score)) = {(result.formula.pBull * 100).toFixed(1)}%<br />
                  equal-weight score = {result.equalWeightScore.toFixed(3)} → {result.equalWeightDirection}
                </p>
                <ul className="mt-3 space-y-2 text-xs leading-5 text-mute">
                  {result.signals.map((signal) => (
                    <li key={signal.id}><span className="text-ink">{signal.label}</span> · signal {signal.value.toFixed(2)} · weight {signal.weight.toFixed(2)} · {signal.note}</li>
                  ))}
                </ul>
              </details>
            </Card>
            <div className="grid gap-3 md:grid-cols-3">
              {[
                ['Traditional ML', 'Random Forest / XGBoost slot', 'Artifact not trained'],
                ['Deep learning', 'LSTM / GRU slot', 'Artifact not trained'],
                ['MarketMind AI', 'Adaptive fusion running now', 'Demonstration heuristic'],
              ].map(([title, body, status]) => (
                <Card key={title} className="p-4">
                  <Badge tone={title === 'MarketMind AI' ? 'info' : 'warn'}>{status}</Badge>
                  <h3 className="mt-3 font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-mute">{body}. No accuracy comparison is shown because evaluation experiments have not been run.</p>
                </Card>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <Card className="p-4">
              <div className="text-[11px] uppercase tracking-[0.14em] text-mute">Market regime</div>
              <div className="mt-2 text-xl font-semibold">{result.regime.label}</div>
              <p className="mt-2 text-xs leading-5 text-mute">{result.regime.disclaimer}</p>
              <div className="mt-4 space-y-2">
                {REGIME_ORDER.map((id) => (
                  <div key={id}>
                    <div className="mb-1 flex justify-between text-[11px] text-mute"><span>{REGIME_LABEL[id]}</span><span className="num">{formatPct(result.regime.probabilities[id] * 100, 0)}</span></div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-card2"><div className="h-full bg-accent" style={{ width: `${result.regime.probabilities[id] * 100}%` }} /></div>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-4 text-sm">
              <div className="flex justify-between gap-3"><span className="text-mute">Volatility</span><span>{result.volatility.class}</span></div>
              <div className="mt-2 flex justify-between gap-3"><span className="text-mute">Prediction time</span><span className="text-right">{formatDateTime(result.generatedAt)}</span></div>
              <div className="mt-2 flex justify-between gap-3"><span className="text-mute">Data as of</span><span className="text-right">{formatDateTime(result.dataAsOf)}</span></div>
              <div className="mt-2 flex justify-between gap-3"><span className="text-mute">Freshness</span><span>Simulated snapshot</span></div>
              <div className="mt-2 flex justify-between gap-3"><span className="text-mute">Model version</span><span className="num text-xs">{result.modelVersion}</span></div>
            </Card>
            <Card className="p-4">
              <div className="text-sm font-semibold">Weights used</div>
              <p className="mt-1 text-xs leading-5 text-mute">Design choices for {result.regime.label.toLowerCase()}, not fitted coefficients.</p>
              <div className="mt-3 space-y-2 text-sm">
                {Object.entries(REGIME_WEIGHTS[result.regime.id]).map(([key, weight]) => (
                  <div key={key} className="flex justify-between"><span className="capitalize text-mute">{key}</span><span className="num">{weight.toFixed(2)}</span></div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}
      {!result && (
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {[
            ['Traditional ML', 'Reserved for a later Random Forest or XGBoost artifact.'],
            ['Deep learning', 'Reserved for a later LSTM or GRU artifact.'],
            ['MarketMind AI', 'Runs the regime-aware demonstration fusion when you press the button.'],
          ].map(([title, body]) => (
            <Card key={title} className="p-4">
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-mute">{body}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
