import { NavLink } from 'react-router-dom'
import {
  Activity,
  ArrowLeftRight,
  BarChart3,
  Brain,
  History,
  Info,
  LayoutDashboard,
  Newspaper,
  Settings,
  ShieldAlert,
  Waves,
  X,
} from 'lucide-react'
import { Logo } from '@/components/Logo'
import { useApp } from '@/context/AppContext'
import { cn } from '@/lib/utils'

const NAV = [
  {
    group: 'Overview',
    items: [{ to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true }],
  },
  {
    group: 'Analysis',
    items: [
      { to: '/app/predict', label: 'AI Prediction', icon: Brain, end: false },
      { to: '/app/intelligence', label: 'Market Intelligence', icon: Activity, end: false },
      { to: '/app/sentiment', label: 'News Sentiment', icon: Newspaper, end: false },
      { to: '/app/correlation', label: 'Cross-Market', icon: ArrowLeftRight, end: false },
      { to: '/app/liquidity', label: 'Liquidity & Volatility', icon: Waves, end: false },
      { to: '/app/risk', label: 'Risk Assessment', icon: ShieldAlert, end: false },
    ],
  },
  {
    group: 'Research',
    items: [
      { to: '/app/history', label: 'Prediction History', icon: History, end: false },
      { to: '/app/performance', label: 'Model Performance', icon: BarChart3, end: false },
      { to: '/app/about', label: 'About the Project', icon: Info, end: false },
    ],
  },
  {
    group: 'System',
    items: [{ to: '/app/settings', label: 'Settings', icon: Settings, end: false }],
  },
]

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { settings } = useApp()
  return (
    <>
      <button
        type="button"
        className={cn('fixed inset-0 z-40 bg-[#040814]/70 lg:hidden', open ? 'block' : 'hidden')}
        aria-label="Close navigation"
        onClick={onClose}
      />
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-line bg-bg2 transition-transform lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between px-4 py-4">
          <Logo />
          <button type="button" className="rounded-lg p-2 text-mute hover:bg-card lg:hidden" onClick={onClose} aria-label="Close menu">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mx-4 mb-3 rounded-xl border border-amberx/30 bg-amberx/10 px-3 py-2 text-[11px] leading-4 text-amberx">
          {settings.apiMode === 'demo' ? 'Demo mode · simulated data' : 'Backend mode · still a research prototype'}
        </div>
        <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
          {NAV.map((group) => (
            <div key={group.group}>
              <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-mute">{group.group}</div>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={onClose}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition',
                        isActive ? 'bg-card text-ink shadow-[inset_2px_0_0_var(--accent)]' : 'text-mute hover:bg-card/70 hover:text-ink',
                      )
                    }
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="border-t border-line px-4 py-4 text-[11px] leading-5 text-mute">
          <div className="font-medium text-ink">Srinjoy Bose · Roll 84</div>
          University of Engineering & Management, Kolkata
        </div>
      </aside>
    </>
  )
}
