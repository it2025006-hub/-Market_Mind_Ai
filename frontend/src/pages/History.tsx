import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download } from 'lucide-react'
import { Badge, Button, Card, Disclaimer, EmptyState, Modal, PageHeader, controlClass } from '@/components/ui'
import { useApp } from '@/context/AppContext'
import { csvEscape, downloadText, formatDateTime, formatPct } from '@/lib/format'

export function HistoryPage() {
  const { history, clearHistory, toast } = useApp()
  const [query, setQuery] = useState('')
  const [direction, setDirection] = useState('ALL')
  const [regime, setRegime] = useState('ALL')
  const [confirm, setConfirm] = useState(false)
  const navigate = useNavigate()
  const regimes = Array.from(new Set(history.map((item) => item.analysis.regime.label)))
  const rows = useMemo(() => history.filter((item) => {
    const blob = `${item.analysis.symbol} ${item.analysis.name} ${item.analysis.regime.label}`.toLowerCase()
    if (query && !blob.includes(query.toLowerCase())) return false
    if (direction !== 'ALL' && item.analysis.direction !== direction) return false
    if (regime !== 'ALL' && item.analysis.regime.label !== regime) return false
    return true
  }), [history, query, direction, regime])

  const exportCsv = () => {
    const header = ['instrument', 'prediction_timestamp', 'horizon', 'direction', 'bullish_probability', 'confidence', 'regime', 'model_version', 'outcome', 'actual_movement', 'simulated']
    const body = rows.map((row) => [
      row.analysis.symbol,
      row.analysis.generatedAt,
      row.analysis.horizonLabel,
      row.analysis.direction,
      row.analysis.bullishProbability.toFixed(4),
      row.analysis.confidence.toFixed(4),
      row.analysis.regime.label,
      row.analysis.modelVersion,
      row.outcome,
      '',
      'true',
    ])
    const csv = [header, ...body].map((line) => line.map(csvEscape).join(',')).join('\n')
    downloadText('marketmind-simulated-predictions.csv', csv)
    toast('CSV downloaded. These rows are not a performance record.', 'success')
  }

  return (
    <div>
      <PageHeader
        eyebrow="Local record"
        title="Prediction History"
        subtitle="Every run you generate is stored in this browser. Outcomes are not evaluated. These rows are not historical model performance."
        actions={<Button variant="secondary" onClick={exportCsv} disabled={rows.length === 0}><Download className="h-4 w-4" /> Export CSV</Button>}
      />
      <div className="mb-5"><Disclaimer /></div>
      <Card className="mb-4 grid gap-3 p-4 md:grid-cols-4">
        <input className={controlClass} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search symbol or regime" aria-label="Search history" />
        <select className={controlClass} value={direction} onChange={(e) => setDirection(e.target.value)} aria-label="Filter direction">
          <option value="ALL">All directions</option>
          <option>BULLISH</option><option>BEARISH</option><option>NEUTRAL</option>
        </select>
        <select className={controlClass} value={regime} onChange={(e) => setRegime(e.target.value)} aria-label="Filter regime">
          <option value="ALL">All regimes</option>
          {regimes.map((item) => <option key={item}>{item}</option>)}
        </select>
        <Button variant="danger" onClick={() => setConfirm(true)} disabled={history.length === 0}>Clear history</Button>
      </Card>
      {rows.length === 0 ? (
        <EmptyState title="No simulated runs match" body="Run a demonstration prediction to create a local record. The outcome column will stay “not evaluated” until a real subsequent move is observed, which this prototype does not invent." action={<Button onClick={() => navigate('/app/predict')}>Run a demo prediction</Button>} />
      ) : (
        <Card className="overflow-x-auto p-4">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-mute">
              <tr>
                <th className="py-2">Instrument</th><th>Timestamp</th><th>Horizon</th><th>Direction</th><th>Probability</th><th>Regime</th><th>Version</th><th>Outcome</th><th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-line">
                  <td className="py-3 font-medium">{row.analysis.symbol}</td>
                  <td className="py-3 text-mute">{formatDateTime(row.analysis.generatedAt)}</td>
                  <td className="py-3">{row.analysis.horizonLabel}</td>
                  <td className="py-3">{row.analysis.direction}</td>
                  <td className="num py-3">{formatPct(row.analysis.bullishProbability * 100, 1)}</td>
                  <td className="py-3">{row.analysis.regime.label}</td>
                  <td className="num py-3 text-xs">{row.analysis.modelVersion}</td>
                  <td className="py-3"><Badge tone="warn">Not evaluated</Badge></td>
                  <td className="py-3 text-right">
                    <button type="button" className="text-xs text-accent" onClick={() => navigate('/app/predict', { state: { analysis: row.analysis } })}>Open</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      <Modal open={confirm} title="Clear simulated history?" onClose={() => setConfirm(false)}>
        <p>This removes demonstration runs stored in this browser. It does not delete a model track record, because none has been recorded.</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirm(false)}>Cancel</Button>
          <Button variant="danger" onClick={() => { clearHistory(); setConfirm(false); toast('Simulated history cleared') }}>Clear</Button>
        </div>
      </Modal>
    </div>
  )
}
