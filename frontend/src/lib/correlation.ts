import type { Timeframe } from '@/data/universe'
import { getInstrument } from '@/data/universe'
import { logReturns } from '@/lib/indicators'
import { generateSeries } from '@/lib/marketSim'
import { mean, percentile, stdev } from '@/lib/utils'

export function pearson(a: number[], b: number[]) {
  const n = Math.min(a.length, b.length)
  if (n < 5) return 0
  const xs = a.slice(-n)
  const ys = b.slice(-n)
  const mx = mean(xs)
  const my = mean(ys)
  let num = 0
  let dx = 0
  let dy = 0
  for (let i = 0; i < n; i += 1) {
    const vx = xs[i] - mx
    const vy = ys[i] - my
    num += vx * vy
    dx += vx * vx
    dy += vy * vy
  }
  if (dx === 0 || dy === 0) return 0
  return num / Math.sqrt(dx * dy)
}

export function rollingPearson(a: number[], b: number[], window: number) {
  const n = Math.min(a.length, b.length)
  const out: number[] = []
  for (let i = window; i <= n; i += 1) {
    out.push(pearson(a.slice(i - window, i), b.slice(i - window, i)))
  }
  return out
}

export function corrStrength(value: number) {
  const abs = Math.abs(value)
  const magnitude = abs < 0.2 ? 'Weak' : abs < 0.5 ? 'Moderate' : abs < 0.75 ? 'Strong' : 'Very strong'
  const sign = value >= 0 ? 'positive' : 'negative'
  return `${magnitude} ${sign}`
}

export interface CorrelationPack {
  symbols: string[]
  matrix: number[][]
  pair: { a: string; b: string; value: number; n: number }
  rolling: { time: number; value: number; stressed: boolean }[]
  window: number
  simulated: true
  note: string
}

export function correlationPack(symbols: string[], a: string, b: string, timeframe: Timeframe, nonce: number, window: number): CorrelationPack {
  const returns = new Map(symbols.map((symbol) => [symbol, logReturns(generateSeries(symbol, timeframe, nonce))]))
  const matrix = symbols.map((left) => symbols.map((right) => pearson(returns.get(left) ?? [], returns.get(right) ?? [])))
  const left = returns.get(a) ?? []
  const right = returns.get(b) ?? []
  const rolled = rollingPearson(left, right, window)
  const candles = generateSeries(a, timeframe, nonce)
  const times = candles.slice(window).map((c) => c.time).slice(-rolled.length)
  const volProxy = logReturns(generateSeries('SPX', timeframe, nonce))
  const rollingVol: number[] = []
  for (let i = window; i <= volProxy.length; i += 1) rollingVol.push(stdev(volProxy.slice(i - window, i)))
  const alignedVol = rollingVol.slice(-rolled.length)
  const threshold = percentile([...alignedVol].sort((x, y) => x - y), 0.8)
  return {
    symbols,
    matrix,
    pair: { a, b, value: pearson(left, right), n: Math.min(left.length, right.length) },
    rolling: rolled.map((value, i) => ({
      time: times[i] ?? candles[candles.length - 1].time,
      value,
      stressed: (alignedVol[i] ?? 0) >= threshold,
    })),
    window,
    simulated: true,
    note: 'Coefficients are computed on a simulated factor dataset. Shared factors were planted so relationships can be studied. They are not estimates from live or historical markets, and they do not imply causation.',
  }
}

export function loadingRows() {
  return ['NIFTY', 'SENSEX', 'NDX', 'SPX', 'GOLD', 'DXY', 'BTC', 'US10Y', 'RELIANCE'].map((symbol) => {
    const item = getInstrument(symbol)
    return { symbol, loadings: item.loadings, idio: item.idio }
  })
}
