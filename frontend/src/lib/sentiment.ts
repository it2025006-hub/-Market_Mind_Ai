const POSITIVE = ['constructive', 'resilient', 'firm', 'improving', 'supportive', 'upbeat', 'steady']
const NEGATIVE = ['cautious', 'weak', 'pressure', 'uncertain', 'soft', 'deteriorating', 'risk-off']
const NEUTRAL = ['scheduled', 'mixed', 'in-line', 'unchanged', 'calendar']

export interface SentimentScore {
  score: number
  label: 'positive' | 'negative' | 'neutral'
  positiveHits: string[]
  negativeHits: string[]
  neutralHits: string[]
  method: 'lexicon-baseline'
}

function hits(text: string, words: string[]) {
  const lower = text.toLowerCase()
  return words.filter((word) => lower.includes(word))
}

export function scoreText(text: string): SentimentScore {
  const positiveHits = hits(text, POSITIVE)
  const negativeHits = hits(text, NEGATIVE)
  const neutralHits = hits(text, NEUTRAL)
  const raw = (positiveHits.length - negativeHits.length) / (positiveHits.length + negativeHits.length + 1)
  const score = Math.max(-1, Math.min(1, raw))
  const label = score > 0.15 ? 'positive' : score < -0.15 ? 'negative' : 'neutral'
  return { score, label, positiveHits, negativeHits, neutralHits, method: 'lexicon-baseline' }
}

export const LEXICON = { POSITIVE, NEGATIVE, NEUTRAL }
