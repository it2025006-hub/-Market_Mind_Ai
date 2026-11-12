import type { Timeframe } from '@/data/universe'
import { atr } from '@/lib/indicators'
import type { Candle } from '@/lib/indicators'
import { generateSeries } from '@/lib/marketSim'
import { detectRegime, volatilityClass } from '@/lib/analysis'
import { mean, stdev } from '@/lib/utils'

export type ScanType = 'swing-high' | 'swing-low' | 'volume-spike' | 'breakout' | 'failed-breakout'

export interface ScanEvent {
  id: string
  time: number
  price: number
  type: ScanType
  label: string
  note: string
}

export interface LiquidityZone {
  id: string
  price: number
  kind: 'supply' | 'demand'
  touches: number
  note: string
}

export interface LiquidityScan {
  symbol: string
  timeframe: Timeframe
  events: ScanEvent[]
  zones: LiquidityZone[]
  volatilityClass: ReturnType<typeof volatilityClass>
  atr: number
  atrPercent: number
  disclaimer: string
}

const NOTE = 'Algorithmic estimate on simulated prices. Not a confirmed institutional order or stop-loss pool.'

export function scanLiquidity(symbol: string, timeframe: Timeframe, nonce = 0, swing = 5): LiquidityScan {
  const candles = generateSeries(symbol, timeframe, nonce)
  const events: ScanEvent[] = []
  const swings: { index: number; price: number; kind: 'supply' | 'demand' }[] = []
  for (let i = swing; i < candles.length - swing; i += 1) {
    const left = candles.slice(i - swing, i)
    const right = candles.slice(i + 1, i + 1 + swing)
    const high = candles[i].high
    const low = candles[i].low
    if (left.every((c) => high > c.high) && right.every((c) => high >= c.high)) {
      swings.push({ index: i, price: high, kind: 'supply' })
      events.push({
        id: `sh-${candles[i].time}`,
        time: candles[i].time,
        price: high,
        type: 'swing-high',
        label: 'Swing high',
        note: NOTE,
      })
    }
    if (left.every((c) => low < c.low) && right.every((c) => low <= c.low)) {
      swings.push({ index: i, price: low, kind: 'demand' })
      events.push({
        id: `sl-${candles[i].time}`,
        time: candles[i].time,
        price: low,
        type: 'swing-low',
        label: 'Swing low',
        note: NOTE,
      })
    }
  }

  const volumes = candles.map((c) => c.volume)
  for (let i = 40; i < candles.length; i += 1) {
    const slice = volumes.slice(i - 40, i)
    const avg = mean(slice)
    const sd = stdev(slice) || 1
    if (candles[i].volume > avg + 2 * sd && candles[i].volume > avg * 1.8) {
      events.push({
        id: `vol-${candles[i].time}`,
        time: candles[i].time,
        price: candles[i].close,
        type: 'volume-spike',
        label: 'Volume spike',
        note: NOTE,
      })
    }
    const prior = candles.slice(i - 20, i)
    const priorHigh = Math.max(...prior.map((c) => c.high))
    const priorLow = Math.min(...prior.map((c) => c.low))
    const brokeUp = candles[i].close > priorHigh
    const brokeDown = candles[i].close < priorLow
    if (brokeUp || brokeDown) {
      events.push({
        id: `bo-${candles[i].time}`,
        time: candles[i].time,
        price: candles[i].close,
        type: 'breakout',
        label: brokeUp ? 'Upside range break' : 'Downside range break',
        note: NOTE,
      })
      const follow = candles.slice(i + 1, i + 4)
      const failed = follow.some((c) => (brokeUp ? c.close < priorHigh : c.close > priorLow))
      if (failed) {
        events.push({
          id: `fb-${candles[i].time}`,
          time: candles[i].time,
          price: candles[i].close,
          type: 'failed-breakout',
          label: 'Potential false break',
          note: 'Price closed back inside the prior 20-bar range within three bars. This is a pattern estimate, not a confirmed trap.',
        })
      }
    }
  }

  const zones: LiquidityZone[] = []
  const used = new Set<number>()
  const recentSwings = swings.filter((s) => s.index > candles.length - 180)
  recentSwings.forEach((swingPoint, index) => {
    if (used.has(index)) return
    const cluster = recentSwings.filter((other, otherIndex) => {
      if (other.kind !== swingPoint.kind) return false
      return Math.abs(other.price - swingPoint.price) / swingPoint.price < 0.004
    })
    cluster.forEach((item) => used.add(recentSwings.indexOf(item)))
    if (cluster.length < 2) return
    const price = cluster.reduce((sum, item) => sum + item.price, 0) / cluster.length
    zones.push({
      id: `zone-${index}`,
      price,
      kind: swingPoint.kind,
      touches: cluster.length,
      note: NOTE,
    })
  })
  zones.sort((a, b) => b.touches - a.touches)

  const atrs = atr(candles, 14)
  const atrValue = atrs[atrs.length - 1] ?? 0
  const regime = detectRegime(symbol, timeframe, nonce)
  return {
    symbol,
    timeframe,
    events: events.slice(-48).reverse(),
    zones: zones.slice(0, 4),
    volatilityClass: volatilityClass(regime.features.atrPercentile),
    atr: atrValue,
    atrPercent: candles.length ? atrValue / candles[candles.length - 1].close : 0,
    disclaimer: NOTE,
  }
}

export function markerFor(type: ScanType): { position: 'aboveBar' | 'belowBar'; shape: 'arrowUp' | 'arrowDown' | 'circle'; color: string } {
  switch (type) {
    case 'swing-high':
      return { position: 'aboveBar', shape: 'arrowDown', color: '#EA3943' }
    case 'swing-low':
      return { position: 'belowBar', shape: 'arrowUp', color: '#16C784' }
    case 'volume-spike':
      return { position: 'aboveBar', shape: 'circle', color: '#22D3EE' }
    case 'breakout':
      return { position: 'aboveBar', shape: 'circle', color: '#2684FF' }
    case 'failed-breakout':
      return { position: 'belowBar', shape: 'circle', color: '#F5B942' }
  }
}
