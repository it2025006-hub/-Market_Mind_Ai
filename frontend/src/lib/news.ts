import { INSTRUMENTS, type Instrument } from '@/data/universe'
import { hashString, mulberry32 } from '@/lib/utils'
import { scoreText, type SentimentScore } from '@/lib/sentiment'

export interface NewsItem {
  id: string
  headline: string
  source: 'MarketMind Sample Desk'
  publishedAt: string
  symbol: string
  name: string
  sector: string
  market: Instrument['market']
  sentiment: SentimentScore
  simulated: true
  notice: 'SAMPLE — not a real headline and not a published article'
}

const TEMPLATES: Array<(item: Instrument) => string> = [
  (item) =>
    `[SAMPLE] Synthetic desk note: constructive and resilient tone discussed beside ${item.name} (${item.symbol}). Not a real article.`,
  (item) =>
    `[SAMPLE] Classroom bulletin: firm and improving demand language used in an illustrative note tagged to ${item.symbol}. Not a published headline.`,
  (item) =>
    `[SAMPLE] Synthetic desk note: cautious tone, weak momentum and pressure discussed beside ${item.name}. Not a real article.`,
  (item) =>
    `[SAMPLE] Classroom bulletin: uncertain and soft flows used in an illustrative note tagged to ${item.symbol}. Not a published headline.`,
  (item) =>
    `[SAMPLE] Illustrative calendar item: scheduled results window tagged to ${item.symbol}. Mixed and in-line language only. Not a real article.`,
  (item) =>
    `[SAMPLE] Synthetic desk note: unchanged positioning language tagged to ${item.name}. Not a published headline.`,
  (item) =>
    `[SAMPLE] Classroom bulletin: supportive cross-read tagged to ${item.symbol}, written only for this prototype. Not a wire story.`,
  (item) =>
    `[SAMPLE] Synthetic desk note: deteriorating and risk-off wording used beside ${item.name} for a classroom filter. Not a real article.`,
]

let cache: NewsItem[] | null = null

export function sampleNews(): NewsItem[] {
  if (cache) return cache
  const now = Date.now()
  const items: NewsItem[] = []
  const universe = INSTRUMENTS.filter((item) => item.assetClass !== 'rates')
  universe.forEach((instrument, index) => {
    const rand = mulberry32(hashString(`news|${instrument.symbol}`))
    const count = 3 + Math.floor(rand() * 2)
    for (let n = 0; n < count; n += 1) {
      const template = TEMPLATES[Math.floor(rand() * TEMPLATES.length)]
      const headline = template(instrument)
      const dayOffset = Math.floor(rand() * 18)
      const hour = 8 + Math.floor(rand() * 10)
      const published = new Date(now - dayOffset * 86_400_000 - hour * 3_600_000 - index * 60_000)
      items.push({
        id: `${instrument.symbol}-${n}`,
        headline,
        source: 'MarketMind Sample Desk',
        publishedAt: published.toISOString(),
        symbol: instrument.symbol,
        name: instrument.name,
        sector: instrument.sector,
        market: instrument.market,
        sentiment: scoreText(headline),
        simulated: true,
        notice: 'SAMPLE — not a real headline and not a published article',
      })
    }
  })
  cache = items.sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt))
  return cache
}

export function newsForSymbol(symbol: string) {
  const tagged = sampleNews().filter((item) => item.symbol === symbol)
  return tagged.length > 0 ? tagged : sampleNews().slice(0, 4)
}

export function averageSentiment(symbol: string) {
  const items = sampleNews().filter((item) => item.symbol === symbol)
  if (items.length === 0) return 0
  return items.reduce((sum, item) => sum + item.sentiment.score, 0) / items.length
}
