import { useEffect, useMemo, useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar } from 'recharts'
import { Badge, Card, Disclaimer, EmptyState, ErrorState, Field, LoadingBlock, PageHeader, controlClass } from '@/components/ui'
import { useApp } from '@/context/AppContext'
import { INSTRUMENTS, MARKETS, SECTORS } from '@/data/universe'
import { formatDateTime, formatDay } from '@/lib/format'
import { LEXICON } from '@/lib/sentiment'
import { useLoad } from '@/hooks/useLoad'
import { loadNews } from '@/services/api'

export function Sentiment() {
  const { settings } = useApp()
  const news = useLoad(() => loadNews(settings), [settings.apiMode, settings.apiBaseUrl])
  const [symbol, setSymbol] = useState('ALL')
  const [sector, setSector] = useState('ALL')
  const [market, setMarket] = useState('ALL')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!news.data?.length || from) return
    const times = news.data.map((item) => +new Date(item.publishedAt)).sort((a, b) => a - b)
    setFrom(new Date(times[0]).toISOString().slice(0, 10))
    setTo(new Date(times[times.length - 1]).toISOString().slice(0, 10))
  }, [news.data, from])

  const filtered = useMemo(() => {
    return (news.data ?? []).filter((item) => {
      if (symbol !== 'ALL' && item.symbol !== symbol) return false
      if (sector !== 'ALL' && item.sector !== sector) return false
      if (market !== 'ALL' && item.market !== market) return false
      if (query && !`${item.headline} ${item.symbol}`.toLowerCase().includes(query.toLowerCase())) return false
      const day = item.publishedAt.slice(0, 10)
      if (from && day < from) return false
      if (to && day > to) return false
      return true
    })
  }, [news.data, symbol, sector, market, from, to, query])

  const counts = {
    positive: filtered.filter((item) => item.sentiment.label === 'positive').length,
    negative: filtered.filter((item) => item.sentiment.label === 'negative').length,
    neutral: filtered.filter((item) => item.sentiment.label === 'neutral').length,
  }
  const average = filtered.length ? filtered.reduce((sum, item) => sum + item.sentiment.score, 0) / filtered.length : 0
  const byDay = Object.values(
    filtered.reduce<Record<string, { day: string; score: number; n: number }>>((acc, item) => {
      const day = item.publishedAt.slice(0, 10)
      acc[day] = acc[day] ?? { day, score: 0, n: 0 }
      acc[day].score += item.sentiment.score
      acc[day].n += 1
      return acc
    }, {}),
  )
    .map((item) => ({ day: formatDay(item.day), score: item.score / item.n }))
    .reverse()
  const bySector = Object.values(
    filtered.reduce<Record<string, { sector: string; intensity: number; n: number }>>((acc, item) => {
      acc[item.sector] = acc[item.sector] ?? { sector: item.sector, intensity: 0, n: 0 }
      acc[item.sector].intensity += Math.abs(item.sentiment.score)
      acc[item.sector].n += 1
      return acc
    }, {}),
  ).map((item) => ({ sector: item.sector, intensity: item.intensity / item.n }))

  return (
    <div>
      <PageHeader
        eyebrow="Sample corpus"
        title="News Sentiment Analysis"
        subtitle="Headlines are synthetic classroom notes from MarketMind Sample Desk. Sentiment is a lexicon baseline, not FinBERT and not a live news feed."
      />
      <div className="mb-5"><Disclaimer /></div>
      {news.loading && <LoadingBlock label="Loading sample notes" />}
      {news.error && <ErrorState message={news.error} onRetry={news.retry} />}
      {news.data && (
        <>
          <Card className="grid gap-3 p-4 md:grid-cols-3 xl:grid-cols-6">
            <Field label="Search">
              <input className={controlClass} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter text" />
            </Field>
            <Field label="Company">
              <select className={controlClass} value={symbol} onChange={(e) => setSymbol(e.target.value)}>
                <option value="ALL">All tagged symbols</option>
                {INSTRUMENTS.map((item) => <option key={item.symbol}>{item.symbol}</option>)}
              </select>
            </Field>
            <Field label="Sector">
              <select className={controlClass} value={sector} onChange={(e) => setSector(e.target.value)}>
                <option value="ALL">All sectors</option>
                {SECTORS.map((item) => <option key={item}>{item}</option>)}
              </select>
            </Field>
            <Field label="Market">
              <select className={controlClass} value={market} onChange={(e) => setMarket(e.target.value)}>
                <option value="ALL">All markets</option>
                {MARKETS.map((item) => <option key={item}>{item}</option>)}
              </select>
            </Field>
            <Field label="From">
              <input type="date" className={controlClass} value={from} onChange={(e) => setFrom(e.target.value)} />
            </Field>
            <Field label="To">
              <input type="date" className={controlClass} value={to} onChange={(e) => setTo(e.target.value)} />
            </Field>
          </Card>
          <div className="mt-5 grid gap-4 lg:grid-cols-4">
            <Card className="p-4"><div className="text-[11px] uppercase tracking-wider text-mute">Average score</div><div className="num mt-2 text-3xl">{average.toFixed(2)}</div></Card>
            <Card className="p-4"><div className="text-[11px] uppercase tracking-wider text-mute">Positive</div><div className="num mt-2 text-3xl text-bull">{counts.positive}</div></Card>
            <Card className="p-4"><div className="text-[11px] uppercase tracking-wider text-mute">Negative</div><div className="num mt-2 text-3xl text-bear">{counts.negative}</div></Card>
            <Card className="p-4"><div className="text-[11px] uppercase tracking-wider text-mute">Neutral</div><div className="num mt-2 text-3xl">{counts.neutral}</div></Card>
          </div>
          {filtered.length === 0 ? (
            <div className="mt-5"><EmptyState title="No sample notes in this filter" body="Widen the date range or clear a symbol filter. The corpus is synthetic, so an empty result is a filter result, not a quiet news day." /></div>
          ) : (
            <>
              <div className="mt-5 grid gap-4 lg:grid-cols-3">
                <Card className="p-4">
                  <h3 className="text-sm font-semibold">Positive vs negative vs neutral</h3>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={[{ name: 'Positive', value: counts.positive }, { name: 'Negative', value: counts.negative }, { name: 'Neutral', value: counts.neutral }]} dataKey="value" nameKey="name" innerRadius={48} outerRadius={72}>
                          <Cell fill="#16C784" /><Cell fill="#EA3943" /><Cell fill="#94A3B8" />
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
                <Card className="p-4 lg:col-span-2">
                  <h3 className="text-sm font-semibold">Sentiment timeline</h3>
                  <p className="text-xs text-mute">Average lexicon score by sample date. Not a market-impact series.</p>
                  <div className="mt-3 h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={byDay}>
                        <CartesianGrid stroke="rgba(148,163,184,0.15)" vertical={false} />
                        <XAxis dataKey="day" stroke="#94A3B8" fontSize={11} />
                        <YAxis stroke="#94A3B8" fontSize={11} domain={[-1, 1]} />
                        <Tooltip />
                        <Line type="monotone" dataKey="score" stroke="#2684FF" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>
              <Card className="mt-4 p-4">
                <h3 className="text-sm font-semibold">Sample sentiment intensity by sector</h3>
                <p className="text-xs leading-5 text-mute">Mean absolute lexicon score inside this sample corpus. This is not a measured price impact.</p>
                <div className="mt-3 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={bySector}>
                      <CartesianGrid stroke="rgba(148,163,184,0.15)" vertical={false} />
                      <XAxis dataKey="sector" stroke="#94A3B8" fontSize={10} interval={0} angle={-20} height={60} textAnchor="end" />
                      <YAxis stroke="#94A3B8" fontSize={11} />
                      <Tooltip />
                      <Bar dataKey="intensity" fill="#22D3EE" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
              <div className="mt-4 space-y-3">
                {filtered.map((item) => (
                  <Card key={item.id} className="p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="warn">SAMPLE</Badge>
                      <Badge tone={item.sentiment.label === 'positive' ? 'bull' : item.sentiment.label === 'negative' ? 'bear' : 'neutral'}>{item.sentiment.label}</Badge>
                      <span className="text-xs text-mute">{item.symbol} · {item.sector} · {item.market}</span>
                    </div>
                    <h3 className="mt-2 text-base font-medium">{item.headline}</h3>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-mute">
                      <span>{item.source}</span>
                      <span>{formatDateTime(item.publishedAt)}</span>
                      <span className="num">score {item.sentiment.score.toFixed(2)}</span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-mute">
                      Lexicon hits — positive: {item.sentiment.positiveHits.join(', ') || 'none'}; negative: {item.sentiment.negativeHits.join(', ') || 'none'}. Active scorer: lexicon baseline. FinBERT is an intended adapter, not loaded.
                    </p>
                  </Card>
                ))}
              </div>
              <p className="mt-4 text-xs leading-5 text-mute">Lexicon includes {LEXICON.POSITIVE.join(', ')}; {LEXICON.NEGATIVE.join(', ')}; {LEXICON.NEUTRAL.join(', ')}.</p>
            </>
          )}
        </>
      )}
    </div>
  )
}
