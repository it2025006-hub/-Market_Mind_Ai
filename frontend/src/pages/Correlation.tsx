import { useMemo, useState } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, Disclaimer, PageHeader, Segmented } from '@/components/ui'
import { useApp } from '@/context/AppContext'
import { HEATMAP_SYMBOLS, STUDY_PAIRS, type Timeframe } from '@/data/universe'
import { correlationPack, corrStrength, loadingRows } from '@/lib/correlation'
import { formatDay } from '@/lib/format'
import { cn } from '@/lib/utils'

function cellColor(value: number) {
  const mag = Math.min(1, Math.abs(value))
  if (value >= 0) return `rgba(22, 199, 132, ${0.12 + mag * 0.75})`
  return `rgba(234, 57, 67, ${0.12 + mag * 0.75})`
}

export function Correlation() {
  const { refreshNonce } = useApp()
  const [pair, setPair] = useState(0)
  const [windowSize, setWindowSize] = useState(40)
  const [timeframe, setTimeframe] = useState<Timeframe>('1d')
  const selected = STUDY_PAIRS[pair]
  const pack = useMemo(
    () => correlationPack([...HEATMAP_SYMBOLS], selected.a, selected.b, timeframe, refreshNonce, windowSize),
    [selected, timeframe, refreshNonce, windowSize],
  )
  const chartData = pack.rolling.map((point) => ({
    day: formatDay(point.time * 1000),
    value: Number(point.value.toFixed(3)),
    stressed: point.stressed,
  }))
  return (
    <div>
      <PageHeader
        eyebrow="Relationship study"
        title="Cross-Market Correlation"
        subtitle="Pearson correlation on a simulated factor dataset. Shared loadings were planted so the method can be demonstrated. Correlation does not imply causation."
      />
      <div className="mb-5"><Disclaimer /></div>
      <div className="mb-4 flex flex-wrap gap-2">
        {STUDY_PAIRS.map((item, index) => (
          <button key={item.title} type="button" onClick={() => setPair(index)} className={cn('rounded-full border px-3 py-1.5 text-xs', index === pair ? 'border-accent bg-accent/10 text-accent' : 'border-line text-mute')}>
            {item.title}
          </button>
        ))}
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Segmented ariaLabel="Rolling window" value={String(windowSize)} onChange={(id) => setWindowSize(Number(id))} options={[{ id: '20', label: '20' }, { id: '40', label: '40' }, { id: '60', label: '60' }]} />
        <Segmented ariaLabel="Correlation timeframe" value={timeframe} onChange={setTimeframe} options={[{ id: '1d', label: '1D' }, { id: '4h', label: '4H' }, { id: '1h', label: '1H' }]} />
      </div>
      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Card className="p-5">
          <div className="text-[11px] uppercase tracking-[0.14em] text-mute">{selected.title}</div>
          <div className="num mt-3 text-5xl">{pack.pair.value.toFixed(2)}</div>
          <div className="mt-2 text-sm text-mute">{corrStrength(pack.pair.value)}</div>
          <p className="mt-4 text-xs leading-5 text-mute">n = {pack.pair.n} aligned simulated returns. A high coefficient in this prototype means the planted factors overlap. It is not a finding about real markets.</p>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold">Rolling correlation</h3>
          <p className="text-xs leading-5 text-mute">Amber spans mark windows where simulated S&amp;P 500 volatility is in its top quintile. In this generator, common-factor variance often rises there, so correlations can tighten. That is a property of the simulator.</p>
          <div className="mt-3 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid stroke="rgba(148,163,184,0.15)" vertical={false} />
                <XAxis dataKey="day" stroke="#94A3B8" fontSize={11} minTickGap={24} />
                <YAxis stroke="#94A3B8" fontSize={11} domain={[-1, 1]} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#2684FF" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      <Card className="mt-4 overflow-x-auto p-5">
        <h3 className="font-semibold">Correlation heatmap</h3>
        <table className="mt-4 w-full min-w-[720px] border-separate border-spacing-1 text-center text-xs">
          <thead>
            <tr>
              <th />
              {pack.symbols.map((symbol) => <th key={symbol} className="px-1 font-medium text-mute">{symbol}</th>)}
            </tr>
          </thead>
          <tbody>
            {pack.symbols.map((row, i) => (
              <tr key={row}>
                <th className="pr-2 text-left font-medium text-mute">{row}</th>
                {pack.matrix[i].map((value, j) => (
                  <td key={`${row}-${pack.symbols[j]}`} className="num rounded-md px-1 py-2 text-ink" style={{ background: cellColor(value) }}>{value.toFixed(2)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Card className="mt-4 p-5">
        <h3 className="font-semibold">Simulation design, disclosed</h3>
        <p className="mt-2 text-sm leading-6 text-mute">{pack.note}</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead className="text-mute"><tr><th className="py-2">Symbol</th><th>Planted loadings</th><th>Idiosyncratic scale</th></tr></thead>
            <tbody>
              {loadingRows().map((row) => (
                <tr key={row.symbol} className="border-t border-line">
                  <td className="py-2 font-medium">{row.symbol}</td>
                  <td className="py-2 text-mute">{Object.entries(row.loadings).map(([k, v]) => `${k} ${v}`).join(' · ')}</td>
                  <td className="num py-2">{row.idio}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
