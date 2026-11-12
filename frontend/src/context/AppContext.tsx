import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { INSTRUMENTS } from '@/data/universe'
import { uid } from '@/lib/utils'
import {
  DEFAULT_SETTINGS,
  DEFAULT_WATCHLIST,
  STORAGE_KEYS,
  loadHistory,
  loadNotifications,
  loadSettings,
  loadWatchlist,
  writeJson,
  type AppSettings,
  type NotificationItem,
  type PredictionRecord,
} from '@/lib/storage'
import type { Analysis } from '@/lib/analysis'
import { clearMarketCache } from '@/lib/marketSim'

interface Toast {
  id: string
  message: string
  tone: 'info' | 'success' | 'warning'
}

interface AppContextValue {
  settings: AppSettings
  updateSettings: (patch: Partial<AppSettings>) => void
  watchlist: string[]
  addWatch: (symbol: string) => void
  removeWatch: (symbol: string) => void
  history: PredictionRecord[]
  addPrediction: (analysis: Analysis) => PredictionRecord
  clearHistory: () => void
  notifications: NotificationItem[]
  pushNotification: (item: Omit<NotificationItem, 'id' | 'time' | 'read'>) => void
  markAllRead: () => void
  selectedSymbol: string
  setSelectedSymbol: (symbol: string) => void
  refreshNonce: number
  refreshData: () => void
  toasts: Toast[]
  toast: (message: string, tone?: Toast['tone']) => void
  dismissToast: (id: string) => void
  resetWorkspace: () => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings())
  const [watchlist, setWatchlist] = useState<string[]>(() => loadWatchlist())
  const [history, setHistory] = useState<PredictionRecord[]>(() => loadHistory())
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => loadNotifications())
  const [selectedSymbol, setSelectedSymbolState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.symbol)
    return saved && INSTRUMENTS.some((item) => item.symbol === saved) ? saved : 'RELIANCE'
  })
  const [refreshNonce, setRefreshNonce] = useState(0)
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme
    writeJson(STORAGE_KEYS.settings, settings)
  }, [settings])

  useEffect(() => writeJson(STORAGE_KEYS.watchlist, watchlist), [watchlist])
  useEffect(() => writeJson(STORAGE_KEYS.history, history), [history])
  useEffect(() => writeJson(STORAGE_KEYS.notifications, notifications.slice(0, 30)), [notifications])
  useEffect(() => localStorage.setItem(STORAGE_KEYS.symbol, selectedSymbol), [selectedSymbol])

  const toast = (message: string, tone: Toast['tone'] = 'info') => {
    const id = uid('toast')
    setToasts((current) => [...current, { id, message, tone }])
    window.setTimeout(() => setToasts((current) => current.filter((item) => item.id !== id)), 3200)
  }

  const value = useMemo<AppContextValue>(
    () => ({
      settings,
      updateSettings: (patch) => setSettings((current) => ({ ...current, ...patch })),
      watchlist,
      addWatch: (symbol) => {
        setWatchlist((current) => (current.includes(symbol) ? current : [...current, symbol]))
        toast(`${symbol} added to the watchlist`)
      },
      removeWatch: (symbol) => {
        setWatchlist((current) => current.filter((item) => item !== symbol))
        toast(`${symbol} removed from the watchlist`)
      },
      history,
      addPrediction: (analysis) => {
        const record: PredictionRecord = {
          id: uid('pred'),
          savedAt: new Date().toISOString(),
          analysis,
          outcome: 'not_evaluated',
          actualMovement: null,
          simulated: true,
        }
        setHistory((current) => [record, ...current].slice(0, 200))
        return record
      },
      clearHistory: () => setHistory([]),
      notifications,
      pushNotification: (item) =>
        setNotifications((current) => [
          { ...item, id: uid('note'), time: new Date().toISOString(), read: false },
          ...current,
        ].slice(0, 30)),
      markAllRead: () => setNotifications((current) => current.map((item) => ({ ...item, read: true }))),
      selectedSymbol,
      setSelectedSymbol: setSelectedSymbolState,
      refreshNonce,
      refreshData: () => {
        clearMarketCache()
        setRefreshNonce((current) => current + 1)
        toast('Simulated snapshot refreshed', 'success')
      },
      toasts,
      toast,
      dismissToast: (id) => setToasts((current) => current.filter((item) => item.id !== id)),
      resetWorkspace: () => {
        setWatchlist(DEFAULT_WATCHLIST)
        setHistory([])
        setNotifications([])
        setSettings(DEFAULT_SETTINGS)
        setSelectedSymbolState('RELIANCE')
        clearMarketCache()
        setRefreshNonce((current) => current + 1)
        toast('Demo workspace reset', 'success')
      },
    }),
    [settings, watchlist, history, notifications, selectedSymbol, refreshNonce, toasts],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
