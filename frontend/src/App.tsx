import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { About } from '@/pages/About'
import { Correlation } from '@/pages/Correlation'
import { Dashboard } from '@/pages/Dashboard'
import { HistoryPage } from '@/pages/History'
import { Intelligence } from '@/pages/Intelligence'
import { Landing } from '@/pages/Landing'
import { Liquidity } from '@/pages/Liquidity'
import { Performance } from '@/pages/Performance'
import { Prediction } from '@/pages/Prediction'
import { Risk } from '@/pages/Risk'
import { Sentiment } from '@/pages/Sentiment'
import { Settings } from '@/pages/Settings'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/app" element={<AppShell />}>
        <Route index element={<Dashboard />} />
        <Route path="predict" element={<Prediction />} />
        <Route path="intelligence" element={<Intelligence />} />
        <Route path="sentiment" element={<Sentiment />} />
        <Route path="correlation" element={<Correlation />} />
        <Route path="liquidity" element={<Liquidity />} />
        <Route path="risk" element={<Risk />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="performance" element={<Performance />} />
        <Route path="about" element={<About />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
