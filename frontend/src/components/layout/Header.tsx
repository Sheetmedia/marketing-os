import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Bell, User, Building2 } from 'lucide-react'
import LanguageSwitcher from './LanguageSwitcher'

interface ClientOption {
  id: string
  name: string
}

export default function Header() {
  const { t } = useTranslation()
  const [clients, setClients] = useState<ClientOption[]>([])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return
    fetch('/api/v1/clients/', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => setClients(data.clients || []))
      .catch(() => setClients([]))
  }, [])

  return (
    <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-20">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('header.searchPlaceholder')}
            className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm transition focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white"
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 h-9 rounded-lg border border-slate-200 bg-slate-50 px-3">
          <Building2 className="h-3.5 w-3.5 text-slate-400" />
          <select className="bg-transparent text-sm font-medium focus:outline-none">
            {clients.length === 0 && <option>{t('header.noClientsYet')}</option>}
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <LanguageSwitcher />
        <button className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
        </button>
        <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
          <div className="h-8 w-8 rounded-full brand-gradient flex items-center justify-center shadow-sm">
            <User className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-medium hidden sm:inline">{t('header.admin')}</span>
        </div>
      </div>
    </header>
  )
}
