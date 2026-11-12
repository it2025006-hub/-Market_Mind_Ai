import type { Analysis } from '@/lib/analysis'

export interface AppSettings {
  theme: 'dark' | 'light'
  apiMode: 'demo' | 'backend'
  apiBaseUrl: string
  reducedMotion: boolean
  coachDismissed: boolean
}

export interface PredictionRecord {
  id: string
  savedAt: string
  analysis: Analysis
  outcome: 'not_evaluated'
  actualMovement: null
  simulated: true
}

export interface NotificationItem {
  id: string
  title: string
  body: string
  time: string
  read: boolean
  tone: 'info' | 'success' | 'warning'
}

export const STORAGE_KEYS = {
  settings: 'marketmind.settings',
  watchlist: 'marketmind.watchlist',
  history: 'marketmind.history',
  symbol: 'marketmind.symbol',
  notifications: 'marketmind.notifications',
} as const

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  apiMode: import.meta.env.VITE_API_MODE === 'backend' ? 'backend' : 'demo',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  reducedMotion: false,
  coachDismissed: false,
}

export const DEFAULT_WATCHLIST = ['RELIANCE', 'TCS', 'NIFTY', 'NVDA', 'GOLD']

export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function loadSettings(): AppSettings {
  const saved = readJson<Partial<AppSettings>>(STORAGE_KEYS.settings, {})
  return {
    ...DEFAULT_SETTINGS,
    ...saved,
    theme: saved.theme === 'light' ? 'light' : 'dark',
    apiMode: saved.apiMode === 'backend' ? 'backend' : saved.apiMode === 'demo' ? 'demo' : DEFAULT_SETTINGS.apiMode,
    apiBaseUrl: typeof saved.apiBaseUrl === 'string' && saved.apiBaseUrl.trim() ? saved.apiBaseUrl : DEFAULT_SETTINGS.apiBaseUrl,
  }
}

export function loadWatchlist() {
  const saved = readJson<unknown>(STORAGE_KEYS.watchlist, DEFAULT_WATCHLIST)
  if (!Array.isArray(saved)) return DEFAULT_WATCHLIST
  const symbols = saved.filter((item): item is string => typeof item === 'string')
  return symbols.length ? symbols : DEFAULT_WATCHLIST
}

export function loadHistory(): PredictionRecord[] {
  const saved = readJson<unknown>(STORAGE_KEYS.history, [])
  if (!Array.isArray(saved)) return []
  return saved.filter((item): item is PredictionRecord => {
    if (!item || typeof item !== 'object') return false
    const record = item as PredictionRecord
    return Boolean(record.id && record.analysis?.symbol && record.analysis?.direction)
  })
}

export function loadNotifications(): NotificationItem[] {
  const saved = readJson<unknown>(STORAGE_KEYS.notifications, null)
  if (!Array.isArray(saved)) {
    return [
      {
        id: 'welcome',
        title: 'Demo mode is active',
        body: 'Prices, sample news and predictions in this prototype are simulated. They are not live market data.',
        time: new Date().toISOString(),
        read: false,
        tone: 'info',
      },
    ]
  }
  return saved.filter((item): item is NotificationItem => Boolean(item && typeof item === 'object' && (item as NotificationItem).id))
}
