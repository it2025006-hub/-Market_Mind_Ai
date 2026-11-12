import type { Candle } from '@/lib/indicators'
import { logReturns } from '@/lib/indicators'
import { mean, percentile, stdev } from '@/lib/utils'

export interface RiskStats {
  hvAnnualized: number
  maxDrawdown: number
  var95: number
  cvar95: number
  observations: number
  underwater: { time: number; drawdown: number }[]
  simulated: true
}

export function riskStats(candles: Candle[]): RiskStats {
  const rets = logReturns(candles)
  const hvAnnualized = stdev(rets) * Math.sqrt(252)
  let peak = candles[0]?.close ?? 0
  let maxDrawdown = 0
  const underwater = candles.map((candle) => {
    peak = Math.max(peak, candle.close)
    const drawdown = peak === 0 ? 0 : (candle.close - peak) / peak
    maxDrawdown = Math.min(maxDrawdown, drawdown)
    return { time: candle.time, drawdown: drawdown * 100 }
  })
  const sorted = [...rets].sort((a, b) => a - b)
  const var95 = percentile(sorted, 0.05)
  const tail = sorted.filter((value) => value <= var95 + 1e-12)
  const cvar95 = tail.length ? mean(tail) : var95
  return {
    hvAnnualized,
    maxDrawdown,
    var95,
    cvar95,
    observations: rets.length,
    underwater: underwater.filter((_, i) => i % Math.ceil(underwater.length / 120) === 0),
    simulated: true,
  }
}

export interface PositionInput {
  balance: number
  riskPct: number
  entry: number
  stop: number
  target?: number | null
}

export interface PositionResult {
  ok: true
  side: 'long' | 'short'
  riskAmount: number
  perUnit: number
  units: number
  notional: number
  lossAtStop: number
  gainAtTarget: number | null
  rewardRisk: number | null
  warnings: string[]
}

export type PositionResponse = PositionResult | { ok: false; errors: string[] }

export function positionSize(input: PositionInput): PositionResponse {
  const errors: string[] = []
  if (!Number.isFinite(input.balance) || input.balance <= 0) errors.push('Account balance must be greater than zero.')
  if (!Number.isFinite(input.riskPct) || input.riskPct <= 0 || input.riskPct > 10) errors.push('Risk percentage must be between 0 and 10.')
  if (!Number.isFinite(input.entry) || input.entry <= 0) errors.push('Entry price must be greater than zero.')
  if (!Number.isFinite(input.stop) || input.stop <= 0) errors.push('Stop-loss price must be greater than zero.')
  if (input.entry === input.stop) errors.push('Stop-loss cannot equal the entry price.')
  const target = input.target
  if (target != null && target !== 0 && !Number.isFinite(target)) errors.push('Target price must be a number.')
  if (errors.length) return { ok: false, errors }

  const side = input.stop < input.entry ? 'long' : 'short'
  if (target != null && target > 0) {
    if (side === 'long' && target <= input.entry) errors.push('For a long example, the target should be above the entry.')
    if (side === 'short' && target >= input.entry) errors.push('For a short example, the target should be below the entry.')
  }
  if (errors.length) return { ok: false, errors }

  const perUnit = Math.abs(input.entry - input.stop)
  const riskAmount = input.balance * (input.riskPct / 100)
  const units = Math.floor(riskAmount / perUnit)
  const warnings: string[] = []
  if (input.riskPct > 2) warnings.push('Risk above 2% of the illustrative account is aggressive for a teaching example.')
  if (perUnit / input.entry < 0.002) warnings.push('The stop is very tight relative to price. Simulated noise can exceed a stop this close.')
  if (units < 1) warnings.push('The risk budget does not cover one unit at this stop distance.')
  const gainAtTarget = target && target > 0 ? units * Math.abs(target - input.entry) : null
  return {
    ok: true,
    side,
    riskAmount,
    perUnit,
    units,
    notional: units * input.entry,
    lossAtStop: units * perUnit,
    gainAtTarget,
    rewardRisk: gainAtTarget != null && riskAmount > 0 ? gainAtTarget / (units * perUnit || 1) : null,
    warnings,
  }
}
