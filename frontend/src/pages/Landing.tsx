import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  Brain,
  GitBranch,
  Layers,
  Scale,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'
import { Logo } from '@/components/Logo'
import { Gauge } from '@/components/charts/Widgets'
import { useApp } from '@/context/AppContext'
import { runAnalysis } from '@/lib/analysis'
import { formatPct } from '@/lib/format'

function CandleField({ paused }: { paused: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas || paused) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let frame = 0
    const candles: { x: number; body: number; wick: number; bull: boolean; y: number }[] = []
    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect()
      if (!rect) return
      canvas.width = Math.max(1, rect.width) * devicePixelRatio
      canvas.height = Math.max(1, rect.height) * devicePixelRatio
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)
    }
    resize()
    const spawn = (x: number) => {
      candles.push({
        x,
        body: 18 + Math.random() * 46,
        wick: 8 + Math.random() * 28,
        bull: Math.random() > 0.46,
        y: 0.42 + Math.random() * 0.18,
      })
    }
    for (let i = 0; i < 42; i += 1) spawn(i * 26)
    const draw = () => {
      const width = canvas.clientWidth
      const height = canvas.clientHeight
      ctx.clearRect(0, 0, width, height)
      candles.forEach((candle) => {
        candle.x -= 0.28
        const mid = height * candle.y
        ctx.strokeStyle = candle.bull ? 'rgba(22,199,132,0.28)' : 'rgba(234,57,67,0.28)'
        ctx.fillStyle = candle.bull ? 'rgba(22,199,132,0.16)' : 'rgba(234,57,67,0.14)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(candle.x, mid - candle.body / 2 - candle.wick)
        ctx.lineTo(candle.x, mid + candle.body / 2 + candle.wick * 0.6)
        ctx.stroke()
        ctx.fillRect(candle.x - 4, mid - candle.body / 2, 8, candle.body)
      })
      while (candles.length && candles[0].x < -20) candles.shift()
      const last = candles[candles.length - 1]
      if (!last || last.x < width - 20) spawn((last?.x ?? width) + 26)
      frame = requestAnimationFrame(draw)
    }
    frame = requestAnimationFrame(draw)
    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
    }
  }, [paused])
  return <canvas ref={ref} className="absolute inset-0 h-full w-full" aria-hidden />
}

const FEATURES = [
  { icon: Layers, title: 'Multi-signal context', body: 'Price, technical state, sample sentiment, volatility and cross-market context are kept in one research workspace.' },
  { icon: Activity, title: 'Regime-aware weights', body: 'A demonstration policy changes signal weights when the simulated path looks trending, sideways or volatile.' },
  { icon: Brain, title: 'Explainable output', body: 'Each demo run shows additive contributions in a SHAP-compatible layout, written for a non-specialist reader.' },
  { icon: Scale, title: 'Uncertainty, separately', body: 'Directional probability is not treated as confidence. Disagreement and volatility widen the band.' },
  { icon: GitBranch, title: 'Cross-market structure', body: 'Relationships are computed on a disclosed factor simulation. The page states that correlation is not causation.' },
  { icon: ShieldAlert, title: 'Risk as a module', body: 'Historical volatility, drawdown, VaR, CVaR and an educational position-size calculator sit beside the call.' },
]

export function Landing() {
  const { settings } = useApp()
  const [menu, setMenu] = useState(false)
  const [reduced, setReduced] = useState(false)
  const preview = useMemo(
    () => runAnalysis({ symbol: 'RELIANCE', timeframe: '1d', horizon: 'next_session', nonce: 0, bars: 250 }),
    [],
  )

  useEffect(() => {
    document.title = 'MarketMind AI · Understand the Market. Predict with Intelligence.'
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => setReduced(media.matches || settings.reducedMotion)
    apply()
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [settings.reducedMotion])

  return (
    <div className="min-h-screen bg-bg text-ink">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Logo />
          <nav className="hidden items-center gap-6 text-sm text-mute md:flex">
            <a href="#features" className="hover:text-ink">Features</a>
            <a href="#method" className="hover:text-ink">Method</a>
            <a href="#research" className="hover:text-ink">Research</a>
            <Link to="/app/about" className="hover:text-ink">About</Link>
          </nav>
          <div className="flex items-center gap-2">
            <button type="button" className="rounded-lg px-3 py-2 text-sm text-mute md:hidden" onClick={() => setMenu((v) => !v)}>Menu</button>
            <Link to="/app" className="inline-flex h-10 items-center rounded-xl bg-accent px-4 text-sm font-medium text-white">Explore Dashboard</Link>
          </div>
        </div>
        {menu && (
          <div className="space-y-2 border-t border-line px-4 py-3 text-sm md:hidden">
            <a href="#features" onClick={() => setMenu(false)} className="block py-1">Features</a>
            <a href="#method" onClick={() => setMenu(false)} className="block py-1">Method</a>
            <a href="#research" onClick={() => setMenu(false)} className="block py-1">Research</a>
            <Link to="/app/about" className="block py-1">About</Link>
          </div>
        )}
      </header>

      <section className="relative overflow-hidden">
        <CandleField paused={reduced} />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-bg/30 via-bg/75 to-bg" />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:py-24">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-line bg-card/80 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-mute">
              Educational research prototype · UEM Kolkata
            </div>
            <h1 className="mt-6 max-w-xl text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
              See Beyond the Price. Understand the Market.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-mute md:text-lg">
              An intelligent financial analysis platform combining machine learning, market sentiment, volatility and multi-signal intelligence to understand potential market movements.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/app" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-accent px-5 text-sm font-medium text-white">
                Explore Dashboard <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#research" className="inline-flex h-12 items-center justify-center rounded-xl border border-line bg-card/80 px-5 text-sm font-medium">
                Discover Our Technology
              </a>
            </div>
            <p className="mt-4 text-xs leading-5 text-mute">No brokerage connection. No live orders. Simulated analysis only.</p>
          </div>
          <div className="rounded-3xl border border-line bg-card/90 p-5 shadow-panel backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-[0.16em] text-mute">Illustrative engine output</div>
                <div className="mt-1 text-lg font-semibold">RELIANCE · NSE</div>
              </div>
              <span className="rounded-full border border-amberx/30 bg-amberx/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-amberx">Simulated</span>
            </div>
            <Gauge value={preview.bullishProbability * 100} caption="Bullish probability" />
            <div className="mt-2 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-bg2 px-2 py-3">
                <div className="text-[10px] uppercase tracking-wider text-mute">Direction</div>
                <div className="mt-1 text-sm font-semibold">{preview.direction}</div>
              </div>
              <div className="rounded-xl bg-bg2 px-2 py-3">
                <div className="text-[10px] uppercase tracking-wider text-mute">Confidence</div>
                <div className="num mt-1 text-sm">{formatPct(preview.confidence * 100, 0)}</div>
              </div>
              <div className="rounded-xl bg-bg2 px-2 py-3">
                <div className="text-[10px] uppercase tracking-wider text-mute">Regime</div>
                <div className="mt-1 text-xs font-medium">{preview.regime.label}</div>
              </div>
            </div>
            <p className="mt-4 text-xs leading-5 text-mute">{preview.disclaimer}</p>
            <Link to="/app/predict" className="mt-4 inline-flex text-sm font-medium text-accent">Open this analysis</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-3 px-4 pb-8 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['6', 'Signal families in the research design'],
          ['5', 'Regime states in the demonstration policy'],
          ['3', 'Model slots, one of them actually running'],
          ['0', 'Live orders or brokerage credentials'],
        ].map(([value, label]) => (
          <div key={label} className="rounded-2xl border border-line bg-card px-4 py-5">
            <div className="num text-3xl text-accent">{value}</div>
            <div className="mt-1 text-sm text-mute">{label}</div>
          </div>
        ))}
      </section>

      <section id="features" className="mx-auto max-w-6xl px-4 py-16">
        <div className="max-w-2xl">
          <div className="text-[11px] uppercase tracking-[0.16em] text-cyanx">Platform</div>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">A research desk, not a static poster.</h2>
          <p className="mt-3 text-sm leading-6 text-mute">Every primary control navigates, filters, calculates or records. Decorative buttons were intentionally left out.</p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <article key={feature.title} className="rounded-2xl border border-line bg-card p-5">
              <feature.icon className="h-5 w-5 text-accent" />
              <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-mute">{feature.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="method" className="border-y border-line bg-bg2/50">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-3xl font-semibold tracking-tight">How the demonstration works</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {[
              ['01', 'Assemble context', 'Simulated OHLCV, technical indicators, lexicon sentiment and related-series returns.'],
              ['02', 'Classify a regime', 'ATR percentile, realised volatility, moving-average slope, return and volume behaviour.'],
              ['03', 'Reweight signals', 'The active regime selects a published demonstration weight policy. Weights are not learned.'],
              ['04', 'Separate the claims', 'Direction, probability, confidence and an uncertainty band are reported as different things.'],
            ].map(([step, title, body]) => (
              <article key={step} className="rounded-2xl border border-line bg-card p-5">
                <div className="num text-sm text-accent">{step}</div>
                <h3 className="mt-3 font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-mute">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="research" className="mx-auto grid max-w-6xl gap-8 px-4 py-16 lg:grid-cols-2">
        <div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-cyanx">Research innovation</div>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">Adaptive fusion, stated as a proposal.</h2>
          <p className="mt-4 text-sm leading-7 text-mute">
            Many forecasting demos freeze one feature set and report a single accuracy number. MarketMind AI proposes a regime-aware multi-signal framework: the importance of momentum, sentiment, volatility, cross-market context and volume is allowed to change with the detected market state. Explanations and uncertainty are part of the output, not an appendix.
          </p>
          <p className="mt-4 text-sm leading-7 text-mute">
            This website demonstrates that architecture. It does not claim the policy has been shown to beat published models, and it does not invent accuracy or profitability figures.
          </p>
        </div>
        <div className="grid gap-3">
          {[
            ['Proposed, not proven', 'The contribution is the combination of adaptive weights, regime context, additive explanation and uncertainty. Validation is future work.'],
            ['No fabricated track record', 'Prediction history stores demonstration runs with outcome marked “not evaluated”.'],
            ['Honest model slots', 'Random Forest, XGBoost, LSTM and GRU are specified. Only the transparent fusion heuristic is executed.'],
          ].map(([title, body]) => (
            <article key={title} className="rounded-2xl border border-line bg-card p-5">
              <div className="flex items-center gap-2 font-semibold"><Sparkles className="h-4 w-4 text-cyanx" /> {title}</div>
              <p className="mt-2 text-sm leading-6 text-mute">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="rounded-3xl border border-amberx/30 bg-amberx/10 p-6 md:p-8">
          <h2 className="text-xl font-semibold">Educational disclaimer</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-mute">
            MarketMind AI is an undergraduate engineering research prototype. Prices, headlines, correlations and predictions shown here are simulated or clearly marked sample material. They are not live financial information, not personalised investment advice, and not evidence of a profitable trading system. Mentor: Dr. Raktim Kumar Dey. Institution: University of Engineering & Management, Kolkata.
          </p>
          <div className="mt-5">
            <Link to="/app" className="inline-flex h-11 items-center rounded-xl bg-accent px-4 text-sm font-medium text-white">Enter the workspace</Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-3">
          <div>
            <Logo />
            <p className="mt-3 text-sm leading-6 text-mute">Understand the Market. Predict with Intelligence.</p>
          </div>
          <div className="text-sm leading-6 text-mute">
            <div className="font-medium text-ink">Project</div>
            Srinjoy Bose<br />
            Enrolment 12025002029066<br />
            Registration 304202500900234<br />
            Roll 84 · Section A
          </div>
          <div className="text-sm leading-6 text-mute">
            <div className="font-medium text-ink">Institution</div>
            University of Engineering & Management, Kolkata<br />
            Mentor: Dr. Raktim Kumar Dey<br />
            <Link to="/app/about" className="text-accent">Read the research note</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
