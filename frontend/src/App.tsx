import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './components/layout/MainLayout'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const Clients = lazy(() => import('./pages/Clients'))
const ClientDetail = lazy(() => import('./pages/ClientDetail'))
const SEOAudit = lazy(() => import('./pages/SEOAudit'))
const Keywords = lazy(() => import('./pages/Keywords'))
const Backlinks = lazy(() => import('./pages/Backlinks'))
const Competitors = lazy(() => import('./pages/Competitors'))
const ContentStudio = lazy(() => import('./pages/ContentStudio'))
const ImageStudio = lazy(() => import('./pages/ImageStudio'))
const SocialMedia = lazy(() => import('./pages/SocialMedia'))
const AdsManager = lazy(() => import('./pages/AdsManager'))
const Campaigns = lazy(() => import('./pages/Campaigns'))
const Reports = lazy(() => import('./pages/Reports'))
const AIAssistant = lazy(() => import('./pages/AIAssistant'))
const Alerts = lazy(() => import('./pages/Alerts'))
const Settings = lazy(() => import('./pages/Settings'))
const SEOByAI = lazy(() => import('./pages/SEOByAI'))
const KnowledgeBase = lazy(() => import('./pages/KnowledgeBase'))
const MarketingBrain = lazy(() => import('./pages/MarketingBrain'))
const Login = lazy(() => import('./pages/Login'))
const Documentation = lazy(() => import('./pages/Documentation'))
const BugReport = lazy(() => import('./pages/BugReport'))

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        <p className="text-gray-500">Loading...</p>
      </div>
    </div>
  )
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token')
  if (!token) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

export default function App() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<RequireAuth><MainLayout /></RequireAuth>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="clients" element={<Clients />} />
          <Route path="clients/:clientId" element={<ClientDetail />} />
          <Route path="seo-audit" element={<SEOAudit />} />
          <Route path="keywords" element={<Keywords />} />
          <Route path="backlinks" element={<Backlinks />} />
          <Route path="competitors" element={<Competitors />} />
          <Route path="content-studio" element={<ContentStudio />} />
          <Route path="image-studio" element={<ImageStudio />} />
          <Route path="social-media" element={<SocialMedia />} />
          <Route path="ads" element={<AdsManager />} />
          <Route path="campaigns" element={<Campaigns />} />
          <Route path="reports" element={<Reports />} />
          <Route path="ai-assistant" element={<AIAssistant />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="seo-by-ai" element={<SEOByAI />} />
          <Route path="knowledge-brain" element={<KnowledgeBase />} />
          <Route path="marketing-brain" element={<MarketingBrain />} />
          <Route path="settings" element={<Settings />} />
          <Route path="documentation" element={<Documentation />} />
          <Route path="bug-report" element={<BugReport />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
