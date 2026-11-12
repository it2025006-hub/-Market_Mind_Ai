import { Card, Disclaimer, PageHeader } from '@/components/ui'

const FACTS = [
  ['Student', 'Srinjoy Bose'],
  ['Enrolment number', '12025002029066'],
  ['Registration number', '304202500900234'],
  ['Roll number', '84'],
  ['Section', 'A'],
  ['Project mentor', 'Dr. Raktim Kumar Dey'],
  ['Institution', 'University of Engineering & Management, Kolkata'],
  ['Category', 'Artificial Intelligence / Machine Learning / Financial Technology'],
]

export function About() {
  return (
    <div>
      <PageHeader
        eyebrow="Academic record"
        title="About the Project"
        subtitle="MarketMind AI: An Explainable, Regime-Aware Multi-Signal Stock Market Prediction System."
      />
      <div className="mb-5"><Disclaimer /></div>
      <Card className="grid gap-3 p-5 sm:grid-cols-2">
        {FACTS.map(([label, value]) => (
          <div key={label} className="rounded-xl bg-bg2 px-4 py-3">
            <div className="text-[11px] uppercase tracking-wider text-mute">{label}</div>
            <div className="mt-1 text-sm font-medium">{value}</div>
          </div>
        ))}
      </Card>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-lg font-semibold">Objective</h2>
          <p className="mt-3 text-sm leading-7 text-mute">
            Design a research prototype that estimates short-term market direction and risk from more than one signal family, and that can change the influence of those signals when the market state changes. The output should be explainable to a retail reader and should separate a directional probability from confidence.
          </p>
        </Card>
        <Card className="p-5">
          <h2 className="text-lg font-semibold">Motivation</h2>
          <p className="mt-3 text-sm leading-7 text-mute">
            A price chart, a headline and a volatility print are usually seen in different places. A teaching system can show when those signals agree, when they conflict, and why a single probability without an uncertainty band is an incomplete statement. The platform is built for professors, students and technical reviewers, not as a brokerage terminal.
          </p>
        </Card>
        <Card className="p-5 lg:col-span-2">
          <h2 className="text-lg font-semibold">Literature the design draws on</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-mute">
            <li>Fama (1970) on the efficient-market hypothesis, as the claim this kind of system has to take seriously.</li>
            <li>Lo (2004) on adaptive markets, which motivates letting relationships change with conditions.</li>
            <li>Hamilton (1989) on regime-switching time series, as the statistical ancestor of regime labels.</li>
            <li>Wilder (1978) for RSI and ATR, and Bollinger (2001) for banded volatility.</li>
            <li>Hochreiter and Schmidhuber (1997) for LSTM, the intended sequence baseline.</li>
            <li>Devlin et al. (2019) for BERT and Araci (2019) for FinBERT, the intended sentiment adapter.</li>
            <li>Lundberg and Lee (2017) for SHAP, the explanation layout this prototype is compatible with.</li>
            <li>Gu, Kelly and Xiu (2020) and Fischer and Krauss (2018), as reference points for machine-learning forecasts in markets. This project does not claim to reproduce or beat their results.</li>
          </ul>
        </Card>
        <Card className="p-5">
          <h2 className="text-lg font-semibold">Research gap, as framed here</h2>
          <p className="mt-3 text-sm leading-7 text-mute">
            A large share of student systems, and much of the price-only forecasting literature, uses one feature family, a fixed weight on those features, a random or weakly purged split, and a single accuracy number. Sentiment work often stops at classification. Explanation papers are rarely written for a non-specialist next to an uncertainty band. That is the gap this project proposes to address. It is not a claim that no published paper has combined any of these ideas.
          </p>
        </Card>
        <Card className="p-5">
          <h2 className="text-lg font-semibold">Proposed contribution</h2>
          <p className="mt-3 text-sm leading-7 text-mute">
            An adaptive multi-signal fusion framework that conditions signal weights on a detected regime, reports probability and confidence separately, and presents additive explanations. The contribution is proposed. This build demonstrates the system design with a transparent heuristic and a simulated factor dataset. It is not a validated trading system, and it is not presented as previously published research under another name.
          </p>
        </Card>
      </div>
      <Card className="mt-4 p-5">
        <h2 className="text-lg font-semibold">System shape</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {['React workspace', 'Data-service interface', 'Demo engine or FastAPI', 'Future model registry'].map((item, index) => (
            <div key={item} className="rounded-xl border border-line bg-bg2 p-4 text-sm">
              <div className="num text-xs text-accent">0{index + 1}</div>
              <div className="mt-2 font-medium">{item}</div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm leading-6 text-mute">
          The interface talks to a service boundary. Demo mode never leaves the browser. Backend mode calls FastAPI. PostgreSQL is specified in the schema for a later research deployment and is not required to run the prototype. API keys, if added, belong in server environment variables only.
        </p>
      </Card>
    </div>
  )
}
