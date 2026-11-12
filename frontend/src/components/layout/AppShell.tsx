import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { SearchModal } from '@/components/layout/SearchModal'
import { ErrorBoundary } from '@/components/ui'
import { useApp } from '@/context/AppContext'
import { cn } from '@/lib/utils'

export function AppShell() {
  const [open, setOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const location = useLocation()
  const { toasts, dismissToast } = useApp()

  useEffect(() => setOpen(false), [location.pathname])
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target
      const typing = target instanceof HTMLElement && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      if (typing) return
      if (event.key === '/' || ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k')) {
        event.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="min-h-screen bg-bg text-ink">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="lg:pl-[260px]">
        <TopBar onMenu={() => setOpen(true)} onSearch={() => setSearchOpen(true)} />
        <main className="px-4 py-6 md:px-6 lg:px-8">
          <ErrorBoundary>
            <div key={location.pathname} className="page-enter">
              <Outlet />
            </div>
          </ErrorBoundary>
        </main>
        <footer className="px-4 pb-8 text-xs leading-5 text-mute md:px-8">
          MarketMind AI is an educational research prototype by Srinjoy Bose, University of Engineering & Management, Kolkata. Simulated outputs are not investment advice.
        </footer>
      </div>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[min(100%-2rem,22rem)] flex-col gap-2">
        {toasts.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => dismissToast(item.id)}
            className={cn(
              'pointer-events-auto rounded-xl border bg-card px-4 py-3 text-left text-sm shadow-panel',
              item.tone === 'warning' ? 'border-amberx/40' : item.tone === 'success' ? 'border-bull/40' : 'border-line',
            )}
          >
            {item.message}
          </button>
        ))}
      </div>
    </div>
  )
}
