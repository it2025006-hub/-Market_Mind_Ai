import {
  FACTOR_NAMES,
  FACTOR_SIGMA,
  type FactorName,
  type Instrument,
  type Timeframe,
  getInstrument,
  timeframeSpec,
} from '@/data/universe'
import type { Candle } from '@/lib/indicators'
import { hashString, mulberry32, randn } from '@/lib/utils'

interface FactorFrame {
  times: number[]
  rows: number[][]
  volMult: number[]
}

const seriesCache = new Map<string, Candle[]>()
const factorCache = new Map<string, FactorFrame>()
const anchors = new Map<number, number>()

export function clearMarketCache() {
  seriesCache.clear()
  factorCache.clear()
}

function anchorFor(nonce: number) {
  if (!anchors.has(nonce)) anchors.set(nonce, Math.floor(Date.now() / 60) * 60)
  return anchors.get(nonce) as number
}

function buildTimes(timeframe: Timeframe, bars: number, end: number) {
  const step = timeframeSpec(timeframe).seconds
  if (timeframe !== '1d') {
    return Array.from({ length: bars }, (_, i) => end - (bars - 1 - i) * step)
  }
  const times: number[] = []
  let cursor = end
  while (times.length < bars) {
    const day = new Date(cursor * 1000).getUTCDay()
    if (day !== 0 && day !== 6) times.push(cursor)
    cursor -= 86400
  }
  return times.reverse()
}

function factorIndex(name: FactorName) {
  return FACTOR_NAMES.indexOf(name)
}

function getFactors(timeframe: Timeframe, nonce: number) {
  const key = `${timeframe}|${nonce}`
  const cached = factorCache.get(key)
  if (cached) return cached
  const spec = timeframeSpec(timeframe)
  const times = buildTimes(timeframe, spec.bars, anchorFor(nonce))
  const rand = mulberry32(hashString(`factors|${key}`))
  const scale = Math.sqrt(spec.seconds / 86400)
  const rows: number[][] = []
  const volMult: number[] = []
  let cluster = 1
  let clusterLeft = 0
  let drift = 0
  let driftLeft = 0
  for (let i = 0; i < times.length; i += 1) {
    if (clusterLeft <= 0) {
      cluster = 0.55 + rand() * 1.7
      clusterLeft = 18 + Math.floor(rand() * 36)
    }
    if (driftLeft <= 0) {
      const roll = rand()
      drift = roll < 0.34 ? 1 : roll < 0.62 ? -1 : 0
      driftLeft = 24 + Math.floor(rand() * 70)
    }
    clusterLeft -= 1
    driftLeft -= 1
    volMult.push(cluster)
    const row = FACTOR_NAMES.map((name) => {
      const shock = randn(rand)
      const driftLoad = name === 'india' || name === 'us' ? 0.22 : name === 'usd' ? -0.12 : 0
      return (shock + drift * driftLoad) * FACTOR_SIGMA[name] * scale * cluster
    })
    rows.push(row)
  }
  const frame = { times, rows, volMult }
  factorCache.set(key, frame)
  return frame
}

function seriesFor(instrument: Instrument, timeframe: Timeframe, nonce: number): Candle[] {
  const key = `${instrument.symbol}|${timeframe}|${nonce}`
  const cached = seriesCache.get(key)
  if (cached) return cached
  const frame = getFactors(timeframe, nonce)
  const spec = timeframeSpec(timeframe)
  const scale = Math.sqrt(spec.seconds / 86400)
  const rand = mulberry32(hashString(`idio|${key}`))
  let logP = Math.log(instrument.basePrice)
  const anchor = Math.log(instrument.basePrice)
  const candles: Candle[] = []
  for (let i = 0; i < frame.times.length; i += 1) {
    let ret = randn(rand) * instrument.idio * scale * frame.volMult[i]
    for (const [name, loading] of Object.entries(instrument.loadings)) {
      ret += (loading ?? 0) * frame.rows[i][factorIndex(name as FactorName)]
    }
    ret += -0.004 * (logP - anchor) * scale
    const open = Math.exp(logP)
    logP += ret
    const close = Math.exp(logP)
    const wick = Math.abs(randn(rand)) * instrument.volatility * scale * 0.45
    const high = Math.max(open, close) * (1 + wick)
    const low = Math.min(open, close) * (1 - Math.min(0.85, wick))
    const volume = Math.max(
      1,
      Math.round(
        instrument.baseVolume *
          frame.volMult[i] *
          (0.55 + rand()) *
          (1 + Math.min(4, Math.abs(ret) / (instrument.volatility * scale + 1e-8))),
      ),
    )
    candles.push({
      time: frame.times[i],
      open,
      high,
      low: Math.max(low, 0.0001),
      close,
      volume,
    })
  }
  seriesCache.set(key, candles)
  return candles
}

export function generateSeries(symbol: string, timeframe: Timeframe, nonce = 0) {
  return seriesFor(getInstrument(symbol), timeframe, nonce).map((candle) => ({ ...candle }))
}

export interface Quote {
  symbol: string
  name: string
  exchange: string
  currency: 'INR' | 'USD'
  price: number
  change: number
  changePct: number
  open: number
  high: number
  low: number
  previousClose: number
  volume: number
  timestamp: string
  spark: number[]
  simulated: true
}

export function getQuote(symbol: string, nonce = 0): Quote {
  const instrument = getInstrument(symbol)
  const daily = generateSeries(symbol, '1d', nonce)
  const last = daily[daily.length - 1]
  const prev = daily[daily.length - 2] ?? last
  const change = last.close - prev.close
  return {
    symbol,
    name: instrument.name,
    exchange: instrument.exchange,
    currency: instrument.currency,
    price: last.close,
    change,
    changePct: prev.close === 0 ? 0 : (change / prev.close) * 100,
    open: last.open,
    high: last.high,
    low: last.low,
    previousClose: prev.close,
    volume: last.volume,
    timestamp: new Date(last.time * 1000).toISOString(),
    spark: daily.slice(-32).map((candle) => candle.close),
    simulated: true,
  }
}

export function getQuotes(symbols: string[], nonce = 0) {
  return symbols.map((symbol) => getQuote(symbol, nonce))
}
