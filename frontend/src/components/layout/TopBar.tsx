import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, Menu, Search, UserRound } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { marketSessions } from '@/lib/sessions'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'

export function TopBar({ onMenu, onSearch }: { onMenu: () => void; onSearch: () => void }) {
  const { notifications, markAllRead, settings } = useApp()
  const [statusOpen, setStatusOpen] = useState(false)
  const [notesOpen, setNotesOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [sessions, setSessions] = useState(() => marketSessions())
  const rootRef = useRef<HTMLDivElement>(null)
  const unread = notifications.filter((item) => !item.read).length

  useEffect(() => {
    const timer = window.setInterval(() => setSessions(marketSessions()), 30000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setStatusOpen(false)
        setNotesOpen(false)
        setProfileOpen(false)
      }
    }
    window.addEventListener('mousedown', onClick)
    return () => window.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <header ref={rootRef} className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-bg/85 px-4 backdrop-blur md:px-6">
      <button type="button" className="rounded-lg p-2 text-mute hover:bg-card lg:hidden" onClick={onMenu} aria-label="Open navigation">
        <Menu className="h-5 w-5" />
      </button>
      <button type="button" onClick={onSearch} className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-xl border border-line bg-card px-3 text-left text-sm text-mute md:max-w-md">
        <Search className="h-4 w-4" />
        <span className="truncate">Search instrument</span>
        <span className="ml-auto hidden rounded-md border border-line px-1.5 py-0.5 text-[10px] md:inline">/</span>
      </button>
      <div className="relative">
        <button type="button" onClick={() => { setStatusOpen((v) => !v); setNotesOpen(false); setProfileOpen(false) }} className="hidden items-center gap-2 rounded-xl border border-line bg-card px-3 py-2 text-xs sm:flex">
          <span className="h-2 w-2 rounded-full bg-cyanx" />
          Simulated session
        </button>
        {statusOpen && (
          <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-line bg-card p-3 shadow-panel">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-mute">Exchange clocks</div>
            <p className="mt-1 text-xs leading-5 text-mute">Hours are real exchange schedules. Prices in this prototype remain simulated.</p>
            <div className="mt-3 space-y-2">
              {sessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between rounded-xl bg-bg2 px-3 py-2 text-sm">
                  <div>
                    <div>{session.label}</div>
                    <div className="text-[11px] text-mute">{session.hours}</div>
                  </div>
                  <span className={cn('text-xs font-medium', session.open ? 'text-bull' : 'text-mute')}>{session.open ? 'Open' : 'Closed'}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="relative">
        <button type="button" className="relative rounded-xl border border-line bg-card p-2 text-mute hover:text-ink" aria-label="Notifications" onClick={() => { setNotesOpen((v) => !v); setStatusOpen(false); setProfileOpen(false); markAllRead() }}>
          <Bell className="h-4 w-4" />
          {unread > 0 && <span className="absolute -right-1 -top-1 h-4 min-w-4 rounded-full bg-accent px-1 text-[10px] leading-4 text-white">{unread}</span>}
        </button>
        {notesOpen && (
          <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-line bg-card p-3 shadow-panel">
            <div className="mb-2 text-sm font-semibold">Notifications</div>
            <div className="max-h-80 space-y-2 overflow-auto">
              {notifications.length === 0 && <p className="text-sm text-mute">No notifications.</p>}
              {notifications.map((item) => (
                <div key={item.id} className="rounded-xl bg-bg2 px-3 py-2">
                  <div className="text-sm font-medium">{item.title}</div>
                  <p className="mt-1 text-xs leading-5 text-mute">{item.body}</p>
                  <div className="mt-1 text-[10px] text-mute">{formatDateTime(item.time)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="relative">
        <button type="button" className="flex items-center gap-2 rounded-xl border border-line bg-card px-2 py-1.5" onClick={() => { setProfileOpen((v) => !v); setNotesOpen(false); setStatusOpen(false) }} aria-label="Open profile">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/15 text-accent"><UserRound className="h-4 w-4" /></span>
          <span className="hidden text-left md:block">
            <span className="block text-xs font-medium">Srinjoy Bose</span>
            <span className="block text-[10px] text-mute">{settings.apiMode === 'demo' ? 'Demo profile' : 'API profile'}</span>
          </span>
        </button>
        {profileOpen && (
          <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-line bg-card p-3 shadow-panel">
            <div className="text-sm font-semibold">Srinjoy Bose</div>
            <p className="mt-1 text-xs leading-5 text-mute">Roll 84 · Section A · Enrolment 12025002029066. This is a project profile, not a brokerage login.</p>
            <div className="mt-3 grid gap-1">
              <Link to="/app/about" className="rounded-lg px-2 py-2 text-sm hover:bg-card2" onClick={() => setProfileOpen(false)}>About the project</Link>
              <Link to="/app/settings" className="rounded-lg px-2 py-2 text-sm hover:bg-card2" onClick={() => setProfileOpen(false)}>Settings</Link>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
