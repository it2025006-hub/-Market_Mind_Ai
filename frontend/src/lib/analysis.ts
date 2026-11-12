import type { Timeframe } from '@/data/universe'
import { getInstrument, relatedSymbols, timeframeSpec } from '@/data/universe'
import { atr, barsPerYear, logReturns, rsi, sma } from '@/lib/indicators'
import { generateSeries } from '@/lib/marketSim'
import { averageSentiment } from '@/lib/news'
import { clamp, mean, percentileRank, softmax, stdev } from '@/lib/utils'

export type RegimeId = 'bull' | 'bear' | 'sideways' | 'high_vol' | 'low_vol'
export type HorizonId = 'next_session' | '3_sessions' | '5_sessions' | '1_hour' | '4_hours'
export type Direction = 'BULLISH' | 'BEARISH' | 'NEUTRAL'
export type SignalId = 'momentum' | 'sentiment' | 'volatility' | 'cross' | 'volume'

export const REGIME_LABEL: Record<RegimeId, string> = {
  bull: 'Trending bullish',
  bear: 'Trending bearish',
  sideways: 'Sideways',
  high_vol: 'High volatility',
  low_vol: 'Low volatility',
}

export const REGIME_ORDER: RegimeId[] = ['bull', 'bear', 'sideways', 'high_vol', 'low_vol']

export const HORIZONS: { id: HorizonId; label: string; minutes: number }[] = [
  { id: 'next_session', label: 'Next trading session', minutes: 1440 },
  { id: '3_sessions', label: 'Next 3 sessions', minutes: 1440 * 3 },
  { id: '5_sessions', label: 'Next 5 sessions', minutes: 1440 * 5 },
  { id: '1_hour', label: 'Next hour', minutes: 60 },
  { id: '4_hours', label: 'Next 4 hours', minutes: 240 },
]

/** Demonstration policy, not a learned weight matrix. */
export const REGIME_WEIGHTS: Record<RegimeId, Record<SignalId, number>> = {
  bull: { momentum: 0.34, sentiment: 0.18, volatility: 0.12, cross: 0.22, volume: 0.14 },
  bear: { momentum: 0.32, sentiment: 0.16, volatility: 0.14, cross: 0.24, volume: 0.14 },
  sideways: { momentum: 0.14, sentiment: 0.3, volatility: 0.16, cross: 0.24, volume: 0.16 },
  high_vol: { momentum: 0.12, sentiment: 0.14, volatility: 0.38, cross: 0.22, volume: 0.14 },
  low_vol: { momentum: 0.3, sentiment: 0.26, volatility: 0.1, cross: 0.2, volume: 0.14 },
}

export const SIGNAL_META: Record<SignalId, { label: string; note: string }> = {
  momentum: {
    label: 'Historical momentum',
    note: 'Blend of the 10-bar return, RSI distance from 50, and the moving-average stack on the simulated path.',
  },
  sentiment: {
    label: 'News sentiment',
    note: 'Average lexicon score of SAMPLE notes tagged to this symbol. This is not FinBERT and not a live news feed.',
  },
  volatility: {
    label: 'Market volatility',
    note: 'Inverted ATR percentile. In this demonstration policy, elevated volatility pushes the bullish score down.',
  },
  cross: {
    label: 'Cross-market context',
    note: 'Average recent return of related simulated series. Correlation in this dataset is planted by a factor model, not estimated from real markets.',
  },
  volume: {
    label: 'Volume confirmation',
    note: 'Volume z-score signed by momentum. It confirms or fades the price signal; it is not a standalone call.',
  },
}

export interface RegimePoint {
  time: number
  id: RegimeId
  probabilities: Record<RegimeId, number>
}

export interface RegimeSnapshot {
  id: RegimeId
  label: string
  probabilities: Record<RegimeId, number>
  features: {
    atrPercentile: number
    hvAnnualized: number
    maSlope: number
    return20: number
    volumeZ: number
  }
  history: RegimePoint[]
  disclaimer: string
}

export interface AnalysisSignal {
  id: SignalId
  label: string
  value: number
  weight: number
  contribution: number
  note: string
}

export interface Analysis {
  simulated: true
  engine: 'demonstration-fusion-v0.1'
  modelVersion: 'demo-fusion-0.1'
  symbol: string
  name: string
  exchange: string
  currency: 'INR' | 'USD'
  timeframe: Timeframe
  horizon: HorizonId
  horizonLabel: string
  generatedAt: string
  dataAsOf: string
  price: number
  direction: Direction
  bullishProbability: number
  bearishProbability: number
  confidence: number
  uncertainty: number
  score: number
  equalWeightScore: number
  equalWeightDirection: Direction
  expectedLow: number
  expectedHigh: number
  volatility: {
    class: 'Low volatility' | 'Normal volatility' | 'High volatility' | 'Extreme volatility'
    atr: number
    atrPercent: number
    percentile: number
    hvAnnualized: number
  }
  regime: RegimeSnapshot
  signals: AnalysisSignal[]
  dispersion: number
  formula: { k: number; score: number; pBull: number }
  narrative: string[]
  disclaimer: string
}

const REGIME_DISCLAIMER =
  'Regime labels are algorithmic estimates on a simulated path. They have not been validated against labelled historical regimes.'

export function volatilityClass(percentile: number): Analysis['volatility']['class'] {
  if (percentile < 0.25) return 'Low volatility'
  if (percentile < 0.6) return 'Normal volatility'
  if (percentile < 0.85) return 'High volatility'
  return 'Extreme volatility'
}

function directionFrom(score: number, probability: number): Direction {
  if (probability >= 0.56 && score > 0.04) return 'BULLISH'
  if (probability <= 0.44 && score < -0.04) return 'BEARISH'
  return 'NEUTRAL'
}

function emptyProbabilities(): Record<RegimeId, number> {
  return { bull: 0, bear: 0, sideways: 0, high_vol: 0, low_vol: 0 }
}

export function detectRegime(symbol: string, timeframe: Timeframe, nonce = 0, bars = 504): RegimeSnapshot {
  const candles = generateSeries(symbol, timeframe, nonce).slice(-Math.max(80, bars))
  const closes = candles.map((c) => c.close)
  const atrs = atr(candles, 14)
  const ma = sma(closes, 20)
  const rets = logReturns(candles)
  const annual = Math.sqrt(barsPerYear(timeframe))
  const points: RegimePoint[] = []
  let latest: RegimeSnapshot | null = null

  for (let i = 40; i < candles.length; i += 1) {
    const atrValue = atrs[i]
    if (atrValue == null || ma[i] == null || ma[i - 5] == null) continue
    const atrPct = atrValue / closes[i]
    const windowStart = Math.max(20, i - 120)
    const window: number[] = []
    for (let j = windowStart; j <= i; j += 1) {
      if (atrs[j] != null) window.push((atrs[j] as number) / closes[j])
    }
    const atrPercentile = percentileRank(window, atrPct)
    const retSlice = rets.slice(Math.max(0, i - 20), i)
    const hv = stdev(retSlice) * annual
    const maSlope = ((ma[i] as number) - (ma[i - 5] as number)) / closes[i]
    const return20 = closes[i - 20] ? closes[i] / closes[i - 20] - 1 : 0
    const volSlice = candles.slice(Math.max(0, i - 20), i).map((c) => c.volume)
    const volMean = mean(volSlice)
    const volSd = stdev(volSlice) || 1
    const volumeZ = (candles[i].volume - volMean) / volSd
    const slopeScore = Math.tanh(maSlope / 0.004)
    const retScore = Math.tanh(return20 / 0.025)
    const scores = [
      Math.max(0, slopeScore) * 2.5 + Math.max(0, retScore) * 1.5 + (1 - atrPercentile) * 0.25,
      Math.max(0, -slopeScore) * 2.5 + Math.max(0, -retScore) * 1.5 + (1 - atrPercentile) * 0.2,
      (1 - Math.min(1, Math.abs(slopeScore))) * 2.3 + (1 - Math.min(1, Math.abs(retScore))) * 1.1 + (atrPercentile > 0.2 && atrPercentile < 0.75 ? 0.55 : 0),
      atrPercentile * 3.1 + (atrPercentile > 0.82 ? 1.5 : 0),
      (1 - atrPercentile) * 3 + (atrPercentile < 0.18 ? 1.3 : 0) + (Math.abs(slopeScore) < 0.35 ? 0.35 : 0),
    ]
    const probs = softmax(scores)
    const probabilities = emptyProbabilities()
    REGIME_ORDER.forEach((id, idx) => {
      probabilities[id] = probs[idx]
    })
    let id: RegimeId = 'sideways'
    let best = -1
    REGIME_ORDER.forEach((regime) => {
      if (probabilities[regime] > best) {
        best = probabilities[regime]
        id = regime
      }
    })
    const point = { time: candles[i].time, id, probabilities }
    if (i % Math.ceil((candles.length - 40) / 72) === 0 || i === candles.length - 1) points.push(point)
    if (i === candles.length - 1) {
      latest = {
        id,
        label: REGIME_LABEL[id],
        probabilities,
        features: { atrPercentile, hvAnnualized: hv, maSlope, return20, volumeZ },
        history: points,
        disclaimer: REGIME_DISCLAIMER,
      }
    }
  }

  if (!latest) {
    return {
      id: 'sideways',
      label: REGIME_LABEL.sideways,
      probabilities: { bull: 0.1, bear: 0.1, sideways: 0.6, high_vol: 0.1, low_vol: 0.1 },
      features: { atrPercentile: 0.5, hvAnnualized: 0, maSlope: 0, return20: 0, volumeZ: 0 },
      history: [],
      disclaimer: REGIME_DISCLAIMER,
    }
  }
  return latest
}

function crossSignal(symbol: string, timeframe: Timeframe, nonce: number) {
  const related = relatedSymbols(symbol)
  const signals = related.map((item) => {
    const candles = generateSeries(item, timeframe, nonce)
    const last = candles[candles.length - 1]?.close ?? 1
    const prev = candles[Math.max(0, candles.length - 11)]?.close ?? last
    const ret = prev === 0 ? 0 : last / prev - 1
    return Math.tanh(ret / 0.02)
  })
  return signals.length ? mean(signals) : 0
}

function horizonBars(horizon: HorizonId, timeframe: Timeframe) {
  const minutes = HORIZONS.find((item) => item.id === horizon)?.minutes ?? 1440
  const barMinutes = timeframeSpec(timeframe).seconds / 60
  return Math.max(1, minutes / barMinutes)
}

export function runAnalysis(input: {
  symbol: string
  timeframe: Timeframe
  horizon: HorizonId
  nonce?: number
  bars?: number
}): Analysis {
  const nonce = input.nonce ?? 0
  const instrument = getInstrument(input.symbol)
  const candles = generateSeries(input.symbol, input.timeframe, nonce).slice(-Math.max(80, input.bars ?? 320))
  const closes = candles.map((c) => c.close)
  const price = closes[closes.length - 1]
  const regime = detectRegime(input.symbol, input.timeframe, nonce, input.bars ?? 320)
  const rsiValues = rsi(closes, 14)
  const rsiLast = rsiValues[rsiValues.length - 1] ?? 50
  const ma20 = sma(closes, 20)
  const ma50 = sma(closes, 50)
  const last = candles.length - 1
  const ret10 = closes[last - 10] ? price / closes[last - 10] - 1 : 0
  const stack =
    (ma20[last] != null && price > (ma20[last] as number) ? 0.5 : -0.5) +
    (ma20[last] != null && ma50[last] != null && (ma20[last] as number) > (ma50[last] as number) ? 0.5 : -0.5)
  const momentum = clamp(Math.tanh(ret10 / 0.02) * 0.45 + ((rsiLast - 50) / 50) * 0.3 + stack * 0.25, -1, 1)
  const sentiment = clamp(averageSentiment(input.symbol), -1, 1)
  const volatilitySignal = clamp(-(regime.features.atrPercentile - 0.5) * 2, -1, 1)
  const cross = clamp(crossSignal(input.symbol, input.timeframe, nonce), -1, 1)
  const volume = clamp(Math.sign(momentum || 1) * (regime.features.volumeZ / 2.5) * (Math.abs(momentum) > 0.05 ? 1 : 0.3), -1, 1)
  const raw: Record<SignalId, number> = {
    momentum,
    sentiment,
    volatility: volatilitySignal,
    cross,
    volume,
  }
  const weights = REGIME_WEIGHTS[regime.id]
  const signals: AnalysisSignal[] = (Object.keys(raw) as SignalId[]).map((id) => ({
    id,
    label: SIGNAL_META[id].label,
    value: raw[id],
    weight: weights[id],
    contribution: weights[id] * raw[id],
    note: SIGNAL_META[id].note,
  }))
  const score = signals.reduce((sum, signal) => sum + signal.contribution, 0)
  const equalWeightScore = mean(Object.values(raw))
  const k = 2.2
  const pBull = 1 / (1 + Math.exp(-k * score))
  const equalP = 1 / (1 + Math.exp(-k * equalWeightScore))
  const dispersion = stdev(Object.values(raw))
  const uncertainty = clamp(0.12 + 0.45 * dispersion + 0.4 * Math.max(0, regime.features.atrPercentile - 0.45), 0.08, 0.9)
  const decisiveness = Math.abs(pBull - 0.5) * 2
  const confidence = clamp(0.12 + 0.62 * decisiveness * (1 - uncertainty) + 0.18 * (1 - Math.min(1, dispersion)), 0.05, 0.9)
  const atrs = atr(candles, 14)
  const atrValue = atrs[atrs.length - 1] ?? price * 0.01
  const band = atrValue * Math.sqrt(horizonBars(input.horizon, input.timeframe)) * (0.85 + uncertainty)
  const volClass = volatilityClass(regime.features.atrPercentile)
  const direction = directionFrom(score, pBull)
  const equalWeightDirection = directionFrom(equalWeightScore, equalP)
  const top = [...signals].sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))[0]
  const narrative = [
    `The demonstration engine read the simulated ${instrument.symbol} path as “${regime.label}”. That label is an algorithmic estimate, not a validated regime call.`,
    `Under the ${regime.label.toLowerCase()} weight policy, ${top.label.toLowerCase()} had the largest absolute contribution (${top.contribution >= 0 ? 'supporting' : 'reducing'} the bullish score).`,
    dispersion > 0.45
      ? 'The input signals do not agree. Uncertainty is therefore wider, and confidence is intentionally lower than the directional probability.'
      : volClass === 'High volatility' || volClass === 'Extreme volatility'
        ? 'Volatility is elevated in this simulated snapshot. The policy treats that as a reason to trust a directional lean less.'
        : 'The weighted signals are relatively aligned in this snapshot. That raises demonstration confidence. It does not turn the output into a forecast.',
    equalWeightDirection === direction
      ? 'An equal-weight policy reaches the same directional bucket on this snapshot. Agreement is not evidence that either policy is accurate.'
      : `An equal-weight policy would read ${equalWeightDirection.toLowerCase()}, while the regime-adaptive policy reads ${direction.toLowerCase()}. The difference illustrates the method. It is not evidence that the adaptive policy is better.`,
    'Directional probability and confidence are different quantities. A leaning probability is not a statement that the engine is likely to be correct.',
  ]
  const horizon = HORIZONS.find((item) => item.id === input.horizon) ?? HORIZONS[0]
  return {
    simulated: true,
    engine: 'demonstration-fusion-v0.1',
    modelVersion: 'demo-fusion-0.1',
    symbol: instrument.symbol,
    name: instrument.name,
    exchange: instrument.exchange,
    currency: instrument.currency,
    timeframe: input.timeframe,
    horizon: horizon.id,
    horizonLabel: horizon.label,
    generatedAt: new Date().toISOString(),
    dataAsOf: new Date(candles[candles.length - 1].time * 1000).toISOString(),
    price,
    direction,
    bullishProbability: pBull,
    bearishProbability: 1 - pBull,
    confidence,
    uncertainty,
    score,
    equalWeightScore,
    equalWeightDirection,
    expectedLow: Math.max(0, price - band),
    expectedHigh: price + band,
    volatility: {
      class: volClass,
      atr: atrValue,
      atrPercent: atrValue / price,
      percentile: regime.features.atrPercentile,
      hvAnnualized: regime.features.hvAnnualized,
    },
    regime,
    signals,
    dispersion,
    formula: { k, score, pBull },
    narrative,
    disclaimer:
      'This output is produced by the MarketMind demonstration fusion engine. It illustrates a proposed adaptive multi-signal method on simulated data. It is not a trained model, not a market forecast, and not investment advice.',
  }
}
