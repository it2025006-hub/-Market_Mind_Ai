import type { Timeframe } from '@/data/universe'

export interface Candle {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export function sma(values: number[], period: number) {
  const out: Array<number | null> = Array(values.length).fill(null)
  let sum = 0
  for (let i = 0; i < values.length; i += 1) {
    sum += values[i]
    if (i >= period) sum -= values[i - period]
    if (i >= period - 1) out[i] = sum / period
  }
  return out
}

export function ema(values: Array<number | null>, period: number) {
  const out: Array<number | null> = Array(values.length).fill(null)
  const k = 2 / (period + 1)
  const seed: number[] = []
  let prev = 0
  let started = false
  for (let i = 0; i < values.length; i += 1) {
    const value = values[i]
    if (value == null) continue
    if (!started) {
      seed.push(value)
      if (seed.length === period) {
        prev = seed.reduce((sum, item) => sum + item, 0) / period
        out[i] = prev
        started = true
      }
    } else {
      prev = value * k + prev * (1 - k)
      out[i] = prev
    }
  }
  return out
}

export function rsi(closes: number[], period = 14) {
  const out: Array<number | null> = Array(closes.length).fill(null)
  if (closes.length <= period) return out
  let gain = 0
  let loss = 0
  for (let i = 1; i <= period; i += 1) {
    const delta = closes[i] - closes[i - 1]
    if (delta >= 0) gain += delta
    else loss -= delta
  }
  let avgGain = gain / period
  let avgLoss = loss / period
  const value = (g: number, l: number) => (l === 0 ? 100 : 100 - 100 / (1 + g / l))
  out[period] = value(avgGain, avgLoss)
  for (let i = period + 1; i < closes.length; i += 1) {
    const delta = closes[i] - closes[i - 1]
    avgGain = (avgGain * (period - 1) + Math.max(delta, 0)) / period
    avgLoss = (avgLoss * (period - 1) + Math.max(-delta, 0)) / period
    out[i] = value(avgGain, avgLoss)
  }
  return out
}

export function macd(closes: number[], fast = 12, slow = 26, signal = 9) {
  const fastLine = ema(closes, fast)
  const slowLine = ema(closes, slow)
  const macdLine = closes.map((_, i) =>
    fastLine[i] != null && slowLine[i] != null ? (fastLine[i] as number) - (slowLine[i] as number) : null,
  )
  const signalLine = ema(macdLine, signal)
  const histogram = macdLine.map((value, i) =>
    value != null && signalLine[i] != null ? value - (signalLine[i] as number) : null,
  )
  return { macd: macdLine, signal: signalLine, histogram }
}

export function bollinger(closes: number[], period = 20, mult = 2) {
  const mid = sma(closes, period)
  const upper: Array<number | null> = Array(closes.length).fill(null)
  const lower: Array<number | null> = Array(closes.length).fill(null)
  for (let i = period - 1; i < closes.length; i += 1) {
    const middle = mid[i] as number
    let variance = 0
    for (let j = i - period + 1; j <= i; j += 1) variance += (closes[j] - middle) ** 2
    const sd = Math.sqrt(variance / period)
    upper[i] = middle + mult * sd
    lower[i] = middle - mult * sd
  }
  return { mid, upper, lower }
}

export function trueRanges(candles: Candle[]) {
  return candles.map((candle, i) => {
    if (i === 0) return candle.high - candle.low
    const prev = candles[i - 1].close
    return Math.max(candle.high - candle.low, Math.abs(candle.high - prev), Math.abs(candle.low - prev))
  })
}

export function atr(candles: Candle[], period = 14) {
  const tr = trueRanges(candles)
  const out: Array<number | null> = Array(candles.length).fill(null)
  if (tr.length < period) return out
  let prev = tr.slice(0, period).reduce((sum, value) => sum + value, 0) / period
  out[period - 1] = prev
  for (let i = period; i < tr.length; i += 1) {
    prev = (prev * (period - 1) + tr[i]) / period
    out[i] = prev
  }
  return out
}

export function logReturns(candles: Candle[]) {
  const out: number[] = []
  for (let i = 1; i < candles.length; i += 1) {
    const prev = candles[i - 1].close
    if (prev > 0 && candles[i].close > 0) out.push(Math.log(candles[i].close / prev))
  }
  return out
}

export function barsPerYear(timeframe: Timeframe) {
  switch (timeframe) {
    case '1m':
      return 252 * 375
    case '5m':
      return 252 * 75
    case '15m':
      return 252 * 25
    case '1h':
      return 252 * 7
    case '4h':
      return 252 * 2
    case '1d':
      return 252
  }
}

export function lastNumber(values: Array<number | null>) {
  for (let i = values.length - 1; i >= 0; i -= 1) {
    if (values[i] != null) return values[i] as number
  }
  return null
}
