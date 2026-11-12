import { useState } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Badge, Card, Disclaimer, Field, Metric, PageHeader, controlClass } from '@/components/ui'

const METRICS = [
  ['Directional accuracy', 'Share of directional calls that match the subsequent move, after a time-based test.'],
  ['Precision / Recall / F1', 'Class-wise quality. Not computed until labelled outcomes exist.'],
  ['ROC-AUC', 'Only appropriate once probabilistic scores are evaluated out of sample.'],
  ['Brier score', 'Mean squared error of probabilities. Requires an evaluated probability set.'],
  ['MAE / RMSE', 'Price-range error. This prototype emits a band, not a point forecast to score.'],
]

export function Performance() {
  const [gross, setGross] = useState('2')
  const [trades, setTrades] = useState('20')
  const [brokerage, setBrokerage] = useState('3')
  const [spread, setSpread] = useState('2')
  const [slippage, setSlippage] = useState('2')
  const costBps = Number(brokerage) + Number(spread) + Number(slippage)
  const net = Number(gross) - (Number(trades) * costBps) / 100
  const valid = [gross, trades, brokerage, spread, slippage].every((value) => Number.isFinite(Number(value)))
  const schematic = Array.from({ length: 11 }, (_, i) => ({ p: i / 10, perfect: i / 10 }))

  return (
    <div>
      <PageHeader
        eyebrow="Evaluation framework"
        title="Model Performance"
        subtitle="The scoreboard is intentionally empty. Experiments have not been run, so this page defines the protocol instead of inventing accuracy."
      />
      <div className="mb-5 rounded-2xl border border-amberx/40 bg-amberx/10 px-4 py-3 text-sm leading-6">
        No directional accuracy, F1, AUC, Brier score, MAE, RMSE or profitability number is available. Placeholders below are not results.
      </div>
      <div className="mb-5"><Disclaimer /></div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {METRICS.map(([label, hint]) => <Metric key={label} label={label} value="—" hint={hint} />)}
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="font-semibold">Intended protocol</h3>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-mute">
            <li>Time-ordered split. No random shuffle of adjacent bars.</li>
            <li>Fit only on the training window. Choose thresholds on validation.</li>
            <li>Walk-forward the test window so each forecast uses only information available at that time.</li>
            <li>Purge overlapping labels so a multi-session horizon cannot leak into training.</li>
            <li>Score direction and probability calibration separately.</li>
            <li>Subtract brokerage, spread and slippage before any strategy discussion.</li>
          </ol>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold">Model family status</h3>
          <table className="mt-3 w-full text-left text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-mute"><tr><th className="py-2">Family</th><th>Role</th><th>Status</th></tr></thead>
            <tbody>
              {[
                ['Random Forest', 'Non-linear tabular baseline', 'Not trained'],
                ['XGBoost', 'Gradient-boosted tabular baseline', 'Not trained'],
                ['LSTM / GRU', 'Sequence baseline', 'Not trained'],
                ['MarketMind fusion', 'Regime-weighted demonstration', 'Heuristic only'],
              ].map((row) => (
                <tr key={row[0]} className="border-t border-line">
                  <td className="py-3">{row[0]}</td>
                  <td className="py-3 text-mute">{row[1]}</td>
                  <td className="py-3"><Badge tone="warn">{row[2]}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="font-semibold">Calibration schematic</h3>
          <p className="text-xs leading-5 text-mute">Reference diagonal only. A model curve will be added after walk-forward evaluation. This line is not a result.</p>
          <div className="mt-3 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={schematic}>
                <CartesianGrid stroke="rgba(148,163,184,0.15)" />
                <XAxis dataKey="p" stroke="#94A3B8" fontSize={11} />
                <YAxis stroke="#94A3B8" fontSize={11} />
                <Tooltip />
                <Line dataKey="perfect" stroke="#94A3B8" dot={false} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold">Cost arithmetic, not a backtest</h3>
          <p className="text-sm leading-6 text-mute">Enter a hypothetical gross return. The net figure is arithmetic. It is not the return of a MarketMind strategy.</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Field label="Hypothetical gross %"><input className={controlClass} value={gross} onChange={(e) => setGross(e.target.value)} /></Field>
            <Field label="Round trips"><input className={controlClass} value={trades} onChange={(e) => setTrades(e.target.value)} /></Field>
            <Field label="Brokerage bps"><input className={controlClass} value={brokerage} onChange={(e) => setBrokerage(e.target.value)} /></Field>
            <Field label="Spread bps"><input className={controlClass} value={spread} onChange={(e) => setSpread(e.target.value)} /></Field>
            <Field label="Slippage bps"><input className={controlClass} value={slippage} onChange={(e) => setSlippage(e.target.value)} /></Field>
          </div>
          <div className="mt-4 rounded-xl bg-bg2 p-4 text-sm">
            {valid ? (
              <>Cost per round trip {costBps.toFixed(1)} bps. Hypothetical net = {Number(gross).toFixed(2)}% − {Number(trades)} × {costBps.toFixed(1)} bps = <span className="num">{net.toFixed(2)}%</span>.</>
            ) : 'Enter numeric assumptions.'}
          </div>
        </Card>
      </div>
    </div>
  )
}
