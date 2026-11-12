export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ')
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function mean(values: number[]) {
  if (values.length === 0) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

export function stdev(values: number[]) {
  if (values.length < 2) return 0
  const avg = mean(values)
  const variance = values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / (values.length - 1)
  return Math.sqrt(variance)
}

export function percentile(sortedAscending: number[], p: number) {
  if (sortedAscending.length === 0) return 0
  const index = clamp(p, 0, 1) * (sortedAscending.length - 1)
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  if (lower === upper) return sortedAscending[lower]
  const weight = index - lower
  return sortedAscending[lower] * (1 - weight) + sortedAscending[upper] * weight
}

export function percentileRank(window: number[], value: number) {
  if (window.length === 0) return 0.5
  let below = 0
  for (const item of window) if (item <= value) below += 1
  return below / window.length
}

export function softmax(scores: number[]) {
  const peak = Math.max(...scores)
  const exps = scores.map((score) => Math.exp(score - peak))
  const total = exps.reduce((sum, value) => sum + value, 0) || 1
  return exps.map((value) => value / total)
}

export function hashString(input: string) {
  let hash = 2166136261
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export function mulberry32(seed: number) {
  let state = seed >>> 0
  return function rand() {
    state |= 0
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function randn(rand: () => number) {
  let u = 0
  while (u === 0) u = rand()
  const v = rand()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

export function uid(prefix = 'id') {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return `${prefix}_${crypto.randomUUID()}`
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}
