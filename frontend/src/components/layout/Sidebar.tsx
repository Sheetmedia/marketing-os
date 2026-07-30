import { NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard, Building2, Search, Key, Link, Swords,
  FileText, Image, Share2, Megaphone, Target, BarChart3,
  Bot, Bell, Settings, ChevronLeft, ChevronRight, Rocket, Brain, BookOpen, LogOut, Bug, Library, Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navGroups = [
  {
    labelKey: 'nav.groups.overview',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
      { to: '/knowledge-brain', icon: Library, labelKey: 'nav.knowledgeBrain' },
      { to: '/marketing-brain', icon: Sparkles, labelKey: 'nav.marketingBrain' },
      { to: '/seo-by-ai', icon: Brain, labelKey: 'nav.seoByAi' },
      { to: '/ai-assistant', icon: Bot, labelKey: 'nav.aiAssistant' },
    ],
  },
  {
    labelKey: 'nav.groups.seo',
    items: [
      { to: '/seo-audit', icon: Search, labelKey: 'nav.seoAudit' },
      { to: '/keywords', icon: Key, labelKey: 'nav.keywords' },
      { to: '/backlinks', icon: Link, labelKey: 'nav.backlinks' },
      { to: '/competitors', icon: Swords, labelKey: 'nav.competitors' },
    ],
  },
  {
    labelKey: 'nav.groups.contentGrowth',
    items: [
      { to: '/content-studio', icon: FileText, labelKey: 'nav.contentStudio' },
      { to: '/image-studio', icon: Image, labelKey: 'nav.imageStudio' },
      { to: '/social-media', icon: Share2, labelKey: 'nav.socialMedia' },
      { to: '/ads', icon: Megaphone, labelKey: 'nav.adsManager' },
      { to: '/campaigns', icon: Target, labelKey: 'nav.campaigns' },
    ],
  },
  {
    labelKey: 'nav.groups.clientsReports',
    items: [
      { to: '/clients', icon: Building2, labelKey: 'nav.clients' },
      { to: '/reports', icon: BarChart3, labelKey: 'nav.reports' },
      { to: '/alerts', icon: Bell, labelKey: 'nav.alerts' },
    ],
  },
]

const bottomItems = [
  { to: '/documentation', icon: BookOpen, labelKey: 'nav.documentation' },
  { to: '/bug-report', icon: Bug, labelKey: 'nav.bugReport' },
  { to: '/settings', icon: Settings, labelKey: 'nav.settings' },
]

export default function Sidebar() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }
  const [collapsed, setCollapsed] = useState(false)

  const linkClass = ({ isActive }: { isActive: boolean }) => cn(
    'group flex items-center gap-2.5 px-2.5 py-[5px] rounded-md text-[13px] font-medium leading-tight transition-all',
    isActive
      ? 'bg-gradient-to-r from-blue-600/20 to-violet-600/10 text-blue-400 border-l-2 border-blue-400 shadow-sm'
      : 'text-slate-400 border-l-2 border-transparent hover:bg-slate-800/70 hover:text-white'
  )

  return (
    <aside className={cn(
      'flex flex-col h-screen bg-slate-900 text-white transition-all duration-300 border-r border-slate-800',
      collapsed ? 'w-16' : 'w-64'
    )}>
      {/* Logo */}
      <div className="flex items-center justify-between gap-2 px-3 h-12 border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg brand-gradient shadow-md shadow-blue-900/40 flex-shrink-0">
            <Rocket className="w-3.5 h-3.5" />
          </div>
          {!collapsed && (
            <span className="text-sm font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent truncate">
              MarketingOS
            </span>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-6 h-6 rounded-md text-slate-400 hover:bg-slate-800 hover:text-white flex-shrink-0 transition-colors"
          title={collapsed ? t('nav.expand') : t('nav.collapse')}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 min-h-0 overflow-y-auto sidebar-scroll py-1.5 px-2 space-y-1.5">
        {navGroups.map((group) => (
          <div key={group.labelKey}>
            {!collapsed && (
              <p className="px-2.5 mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                {t(group.labelKey)}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink key={item.to} to={item.to} className={linkClass}>
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  {!collapsed && <span>{t(item.labelKey)}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="border-t border-slate-800 p-1.5 space-y-0.5 flex-shrink-0">
        {bottomItems.map((item) => (
          <NavLink key={item.to} to={item.to} className={linkClass}>
            <item.icon className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>{t(item.labelKey)}</span>}
          </NavLink>
        ))}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-2.5 py-[5px] rounded-md text-[13px] font-medium text-red-400 hover:bg-red-900/20 hover:text-red-300 w-full transition-colors"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>{t('nav.logout')}</span>}
        </button>
      </div>
    </aside>
  )
}
