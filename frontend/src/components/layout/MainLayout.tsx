import { Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Bug } from 'lucide-react'
import Sidebar from './Sidebar'
import Header from './Header'
import HelpGuide from './HelpGuide'

export default function MainLayout() {
  const { t } = useTranslation()
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 to-slate-100/60 p-6">
          <Outlet />
        </main>
      </div>
      <HelpGuide />
      <button onClick={() => window.location.href = '/bug-report'} className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-red-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg hover:bg-red-700 transition" title={t('header.reportBug')}>
        <Bug className="h-4 w-4" /> {t('nav.bugReport')}
      </button>
    </div>
  )
}
