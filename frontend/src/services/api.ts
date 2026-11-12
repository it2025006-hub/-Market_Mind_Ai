import type { Timeframe } from '@/data/universe'
import type { HorizonId, Analysis } from '@/lib/analysis'
import type { Candle } from '@/lib/indicators'
import { runAnalysis } from '@/lib/analysis'
import { generateSeries, getQuote, getQuotes, type Quote } from '@/lib/marketSim'
import { sampleNews, type NewsItem } from '@/lib/news'
import type { AppSettings } from '@/lib/storage'

export class ApiError extends Error {
  status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request<T>(settings: AppSettings, path: string, init?: RequestInit): Promise<T> {
  const base = settings.apiBaseUrl.replace(/\/$/, '')
  let response: Response
  try {
    response = await fetch(`${base}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...(init?.headers ?? {}),
      },
    })
  } catch {
    throw new ApiError('Backend unreachable. Start the API or switch Settings back to demo mode.')
  }
  if (!response.ok) {
    let detail = response.statusText || 'Request failed'
    try {
      const body = await response.json()
      if (typeof body?.detail === 'string') detail = body.detail
    } catch {
      /* malformed error body */
    }
    throw new ApiError(detail, response.status)
  }
  try {
    return (await response.json()) as T
  } catch {
    throw new ApiError('Malformed API response')
  }
}

export async function checkHealth(settings: AppSettings) {
  return request<{ status: string; mode: string; service: string }>(settings, '/api/health')
}

export async function loadCandles(settings: AppSettings, symbol: string, timeframe: Timeframe, nonce: number) {
  if (settings.apiMode === 'demo') return generateSeries(symbol, timeframe, nonce)
  const payload = await request<{ candles?: Candle[] }>(
    settings,
    `/api/market/ohlcv?symbol=${encodeURIComponent(symbol)}&timeframe=${timeframe}&nonce=${nonce}`,
  )
  if (!Array.isArray(payload.candles) || payload.candles.some((c) => typeof c?.close !== 'number')) {
    throw new ApiError('Malformed candle payload')
  }
  return payload.candles
}

export async function loadQuotes(settings: AppSettings, symbols: string[], nonce: number): Promise<Quote[]> {
  if (settings.apiMode === 'demo') return getQuotes(symbols, nonce)
  const payload = await request<{ quotes?: Quote[] }>(
    settings,
    `/api/market/quotes?symbols=${encodeURIComponent(symbols.join(','))}&nonce=${nonce}`,
  )
  if (!Array.isArray(payload.quotes)) throw new ApiError('Malformed quote payload')
  return payload.quotes
}

export async function loadQuote(settings: AppSettings, symbol: string, nonce: number) {
  if (settings.apiMode === 'demo') return getQuote(symbol, nonce)
  const quotes = await loadQuotes(settings, [symbol], nonce)
  if (!quotes[0]) throw new ApiError('Quote missing from payload')
  return quotes[0]
}

export async function loadNews(settings: AppSettings): Promise<NewsItem[]> {
  if (settings.apiMode === 'demo') return sampleNews()
  const payload = await request<{ items?: NewsItem[] }>(settings, '/api/news')
  if (!Array.isArray(payload.items)) throw new ApiError('Malformed news payload')
  return payload.items
}

export async function loadPrediction(
  settings: AppSettings,
  input: { symbol: string; timeframe: Timeframe; horizon: HorizonId; nonce: number; bars: number },
): Promise<Analysis> {
  if (settings.apiMode === 'demo') {
    return runAnalysis(input)
  }
  const payload = await request<{ analysis?: Analysis }>(settings, '/api/predict', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  if (!payload.analysis || typeof payload.analysis.bullishProbability !== 'number' || !payload.analysis.symbol) {
    throw new ApiError('Malformed prediction payload')
  }
  return { ...payload.analysis, simulated: true }
}
