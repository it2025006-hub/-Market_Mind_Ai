import { useState } from 'react'
import { Button, Card, Disclaimer, Field, Modal, PageHeader, controlClass } from '@/components/ui'
import { useApp } from '@/context/AppContext'
import { checkHealth } from '@/services/api'
import { cn } from '@/lib/utils'

export function Settings() {
  const { settings, updateSettings, resetWorkspace, toast } = useApp()
  const [status, setStatus] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)
  const [confirm, setConfirm] = useState(false)

  const test = async () => {
    setChecking(true)
    setStatus(null)
    try {
      const health = await checkHealth({ ...settings, apiMode: 'backend' })
      setStatus(`Connected. ${health.service} reports ${health.status} (${health.mode}).`)
      toast('Backend health check succeeded', 'success')
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Health check failed')
    } finally {
      setChecking(false)
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Workspace"
        title="Settings"
        subtitle="Theme, motion and API mode are stored in this browser. Secrets are never entered here."
      />
      <div className="mb-5"><Disclaimer /></div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-semibold">Appearance</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {(['dark', 'light'] as const).map((theme) => (
              <button key={theme} type="button" onClick={() => updateSettings({ theme })} className={cn('rounded-2xl border p-4 text-left', settings.theme === theme ? 'border-accent' : 'border-line')}>
                <div className={cn('mb-3 h-12 rounded-lg', theme === 'dark' ? 'bg-[#080E1B]' : 'bg-[#F4F7FB]')} />
                <div className="text-sm font-medium capitalize">{theme}</div>
              </button>
            ))}
          </div>
          <label className="mt-4 flex items-center gap-3 text-sm">
            <input type="checkbox" checked={settings.reducedMotion} onChange={(e) => updateSettings({ reducedMotion: e.target.checked })} />
            Reduce motion on the landing background
          </label>
        </Card>
        <Card className="p-5">
          <h2 className="font-semibold">Data connection</h2>
          <p className="mt-2 text-sm leading-6 text-mute">Demo mode is self-contained. Backend mode calls FastAPI. Market and news API keys, if you add them later, belong in the server <span className="num">.env</span>, never in this page.</p>
          <div className="mt-4 flex gap-2">
            {(['demo', 'backend'] as const).map((mode) => (
              <button key={mode} type="button" onClick={() => updateSettings({ apiMode: mode })} className={cn('rounded-xl border px-3 py-2 text-sm capitalize', settings.apiMode === mode ? 'border-accent bg-accent/10 text-accent' : 'border-line')}>
                {mode}
              </button>
            ))}
          </div>
          <div className="mt-4">
            <Field label="API base URL" hint="Used only in backend mode. Example: http://localhost:8000">
              <input className={controlClass} value={settings.apiBaseUrl} onChange={(e) => updateSettings({ apiBaseUrl: e.target.value })} />
            </Field>
          </div>
          <div className="mt-4 flex gap-2">
            <Button variant="secondary" onClick={test} disabled={checking}>{checking ? 'Checking' : 'Test connection'}</Button>
          </div>
          {status && <p className="mt-3 text-sm leading-6 text-mute">{status}</p>}
          <ul className="mt-4 list-disc space-y-1 pl-5 text-xs leading-5 text-mute">
            <li>MARKET_DATA_API_KEY — server only, optional</li>
            <li>NEWS_API_KEY — server only, optional</li>
            <li>DATABASE_URL — optional PostgreSQL</li>
          </ul>
        </Card>
        <Card className="p-5">
          <h2 className="font-semibold">Local workspace</h2>
          <p className="mt-2 text-sm leading-6 text-mute">Watchlist, prediction history, notifications and these preferences live in localStorage. No financial-account credentials are stored.</p>
          <div className="mt-4">
            <Button variant="danger" onClick={() => setConfirm(true)}>Reset demo workspace</Button>
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="font-semibold">Authentication</h2>
          <p className="mt-2 text-sm leading-6 text-mute">Login is not enabled. The profile chip identifies the student project. It is not a user account and cannot connect to a broker.</p>
        </Card>
      </div>
      <Modal open={confirm} title="Reset the demo workspace?" onClose={() => setConfirm(false)}>
        <p>This restores the default watchlist, clears simulated prediction history and resets preferences in this browser.</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirm(false)}>Cancel</Button>
          <Button variant="danger" onClick={() => { resetWorkspace(); setConfirm(false) }}>Reset</Button>
        </div>
      </Modal>
    </div>
  )
}
