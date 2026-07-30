import React, { useState, useEffect, useCallback } from 'react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  Users,
  Search,
  Link2,
  Rocket,
  FileText,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Target,
  BarChart3,
  RefreshCw,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

// ---------------------------------------------------------------------------
// API Helpers
// ---------------------------------------------------------------------------

const API = '/api/v1'
const getHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json',
})

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DashboardData {
  seo_score: number
  total_keywords: number
  total_backlinks: number
  active_campaigns: number
  content_count?: number
  traffic_data?: { month: string; organic: number; paid: number }[]
  keyword_distribution?: { range: string; count: number; fill: string }[]
  recent_activity?: { id: number; message: string; type: string; time: string }[]
  top_keywords?: { keyword: string; position: number; change: number; volume: number; client: string }[]
  campaigns?: { name: string; client: string; progress: number; status: string; type: string }[]
  alerts?: { id: number; severity: string; message: string; time: string }[]
}

interface ClientInfo {
  id: number | string
  name: string
  [key: string]: any
}

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-7 w-16 rounded bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="h-11 w-11 rounded-lg bg-gray-200 dark:bg-gray-700" />
      </div>
      <div className="mt-3 h-4 w-28 rounded bg-gray-200 dark:bg-gray-700" />
    </div>
  )
}

function SkeletonChart() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800 animate-pulse">
      <div className="mb-4 h-6 w-48 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="h-72 rounded bg-gray-100 dark:bg-gray-700" />
    </div>
  )
}

function SkeletonList() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800 animate-pulse">
      <div className="mb-4 h-6 w-40 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-3 w-20 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <BarChart3 className="mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
      <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface StatCardProps {
  title: string
  value: string
  change?: string
  trend?: 'up' | 'down'
  icon: React.ElementType
  color: string
}

function StatsCard({ title, value, change, trend, icon: Icon, color }: StatCardProps) {
  return (
    <div className="card-hover rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{value}</p>
        </div>
        <div className={`rounded-lg bg-gradient-to-br ${color} p-3 text-white shadow-sm`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {change && trend && (
        <div className="mt-3 flex items-center text-sm">
          {trend === 'up' ? (
            <ArrowUpRight className="mr-1 h-4 w-4 text-emerald-500" />
          ) : (
            <ArrowDownRight className="mr-1 h-4 w-4 text-rose-500" />
          )}
          <span className={trend === 'up' ? 'text-emerald-600' : 'text-rose-600'}>{change}</span>
          <span className="ml-1 text-gray-400">vs last month</span>
        </div>
      )}
    </div>
  )
}

function ActivityIcon({ type }: { type: string }) {
  switch (type) {
    case 'audit':
      return <CheckCircle className="h-4 w-4 text-emerald-500" />
    case 'backlink':
      return <Link2 className="h-4 w-4 text-blue-500" />
    case 'content':
      return <FileText className="h-4 w-4 text-violet-500" />
    case 'keyword':
      return <TrendingUp className="h-4 w-4 text-amber-500" />
    case 'campaign':
      return <Rocket className="h-4 w-4 text-cyan-500" />
    case 'alert':
      return <AlertTriangle className="h-4 w-4 text-rose-500" />
    case 'client':
      return <Users className="h-4 w-4 text-indigo-500" />
    default:
      return <Activity className="h-4 w-4 text-gray-400" />
  }
}

// ---------------------------------------------------------------------------
// Dashboard Page
// ---------------------------------------------------------------------------

export default function Dashboard() {
  const { t } = useTranslation()
  const [clients, setClients] = useState<ClientInfo[]>([])
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true)
      else setLoading(true)
      setError(null)

      // 1. Fetch clients list
      const clientsRes = await fetch(`${API}/clients/`, { headers: getHeaders() })
      if (clientsRes.status === 401) { localStorage.removeItem('token'); window.location.href = '/login'; return null; }
      if (!clientsRes.ok) throw new Error(`Error: ${clientsRes.status}`)
      const clientsJson = await clientsRes.json()
      const clientsList: ClientInfo[] = clientsJson.clients || []
      setClients(clientsList)

      // 2. If we have clients, fetch dashboard data for each and aggregate
      if (clientsList.length > 0) {
        const dashboardResults = await Promise.allSettled(
          clientsList.map((c) =>
            fetch(`${API}/clients/${c.id}/dashboard`, { headers: getHeaders() }).then((r) => {
              if (r.status === 401) { localStorage.removeItem('token'); window.location.href = '/login'; return null; }
              if (!r.ok) throw new Error(`Error: ${r.status}`)
              return r.json()
            })
          )
        )

        const fulfilled = dashboardResults
          .filter((r): r is PromiseFulfilledResult<DashboardData> => r.status === 'fulfilled' && r.value != null)
          .map((r) => r.value)

        // Aggregate stats
        const totalSeoScore =
          fulfilled.length > 0
            ? fulfilled.reduce((sum, d) => sum + (d.seo_score || 0), 0) / fulfilled.length
            : 0
        const totalKeywords = fulfilled.reduce((sum, d) => sum + (d.total_keywords || 0), 0)
        const totalBacklinks = fulfilled.reduce((sum, d) => sum + (d.total_backlinks || 0), 0)
        const totalActiveCampaigns = fulfilled.reduce(
          (sum, d) => sum + (d.active_campaigns || 0),
          0
        )
        const totalContentCount = fulfilled.reduce(
          (sum, d) => sum + (d.content_count || 0),
          0
        )

        // Merge array data from all clients
        const allTraffic = fulfilled.flatMap((d) => d.traffic_data || [])
        const allKeywordDist = fulfilled.flatMap((d) => d.keyword_distribution || [])
        const allActivity = fulfilled.flatMap((d) => d.recent_activity || [])
        const allTopKeywords = fulfilled.flatMap((d) => d.top_keywords || [])
        const allCampaigns = fulfilled.flatMap((d) => d.campaigns || [])
        const allAlerts = fulfilled.flatMap((d) => d.alerts || [])

        setDashboardData({
          seo_score: totalSeoScore,
          total_keywords: totalKeywords,
          total_backlinks: totalBacklinks,
          active_campaigns: totalActiveCampaigns,
          content_count: totalContentCount,
          traffic_data: allTraffic,
          keyword_distribution: allKeywordDist,
          recent_activity: allActivity,
          top_keywords: allTopKeywords,
          campaigns: allCampaigns,
          alerts: allAlerts,
        })
      }
    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err)
      setError(err.message || t('dashboard.tryAgain'))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Computed stats cards
  const statsCards: StatCardProps[] = [
    {
      title: t('dashboard.totalClients'),
      value: clients.length.toLocaleString(),
      icon: Users,
      color: 'from-blue-500 to-blue-600',
    },
    {
      title: t('dashboard.avgSeoScore'),
      value: dashboardData ? dashboardData.seo_score.toFixed(1) : '0',
      icon: Target,
      color: 'from-emerald-500 to-emerald-600',
    },
    {
      title: t('dashboard.totalKeywordsTracked'),
      value: (dashboardData?.total_keywords || 0).toLocaleString(),
      icon: Search,
      color: 'from-violet-500 to-violet-600',
    },
    {
      title: t('dashboard.totalBacklinks'),
      value: (dashboardData?.total_backlinks || 0).toLocaleString(),
      icon: Link2,
      color: 'from-amber-500 to-amber-600',
    },
    {
      title: t('dashboard.activeCampaigns'),
      value: (dashboardData?.active_campaigns || 0).toLocaleString(),
      icon: Rocket,
      color: 'from-rose-500 to-rose-600',
    },
    {
      title: t('dashboard.aiContentGenerated'),
      value: (dashboardData?.content_count || 0).toLocaleString(),
      icon: FileText,
      color: 'from-cyan-500 to-cyan-600',
    },
  ]

  const trafficData = dashboardData?.traffic_data || []
  const keywordDistribution = dashboardData?.keyword_distribution || []
  const recentActivity = dashboardData?.recent_activity || []
  const topKeywords = dashboardData?.top_keywords || []
  const activeCampaigns = dashboardData?.campaigns || []
  const alertsList = dashboardData?.alerts || []

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="h-8 w-48 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
            <div className="mt-2 h-5 w-80 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
          </div>
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
          <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <SkeletonChart />
            <SkeletonChart />
          </div>
          <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <SkeletonList />
            <SkeletonList />
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <SkeletonList />
            <SkeletonList />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('dashboard.title')}</h1>
          </div>
          <div className="flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 py-16 shadow-sm dark:border-red-800 dark:bg-red-900/20">
            <AlertTriangle className="mb-4 h-12 w-12 text-red-400" />
            <h2 className="text-lg font-semibold text-red-700 dark:text-red-300">
              {t('dashboard.failedToLoad')}
            </h2>
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={() => fetchData()}
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              {t('dashboard.tryAgainButton')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (clients.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('dashboard.title')}</h1>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              {t('dashboard.welcome')}
            </p>
          </div>
          <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-24 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <Users className="mb-4 h-16 w-16 text-gray-300 dark:text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
              {t('dashboard.noClientsYet')}
            </h2>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              {t('dashboard.noClientsDesc')}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8 flex items-center justify-between pb-5 border-b border-slate-200 dark:border-gray-700">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">{t('dashboard.title')}</h1>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              {t('dashboard.welcome')}
            </p>
          </div>
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-slate-50 hover:shadow-md disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? t('dashboard.refreshing') : t('dashboard.refresh')}
          </button>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {statsCards.map((stat) => (
            <StatsCard key={stat.title} {...stat} />
          ))}
        </div>

        {/* Charts Row */}
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Organic Traffic Trend */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              {t('dashboard.organicTrafficTrend')}
            </h2>
            <div className="h-72">
              {trafficData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trafficData}>
                    <defs>
                      <linearGradient id="organicGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="paidGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#f9fafb',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="organic"
                      stroke="#3b82f6"
                      fill="url(#organicGradient)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="paid"
                      stroke="#8b5cf6"
                      fill="url(#paidGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState message={t('common.noData')} />
              )}
            </div>
          </div>

          {/* Keyword Rankings Distribution */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              {t('dashboard.keywordRankingsDistribution')}
            </h2>
            <div className="h-72">
              {keywordDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={keywordDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="range" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#f9fafb',
                      }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {keywordDistribution.map((entry, index) => (
                        <rect key={index} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState message={t('common.noData')} />
              )}
            </div>
          </div>
        </div>

        {/* Middle Row: Recent Activity + Top Keywords */}
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Recent Activity Feed */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              {t('dashboard.recentActivity')}
            </h2>
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((item) => (
                  <div key={item.id} className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-full bg-gray-100 p-2 dark:bg-gray-700">
                      <ActivityIcon type={item.type} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 dark:text-gray-300">{item.message}</p>
                      <p className="mt-0.5 flex items-center text-xs text-gray-400">
                        <Clock className="mr-1 h-3 w-3" />
                        {item.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message={t('common.noData')} />
            )}
          </div>

          {/* Top Performing Keywords */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              {t('dashboard.topPerformingKeywords')}
            </h2>
            {topKeywords.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">{t('dashboard.table.keyword')}</th>
                      <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">{t('dashboard.table.position')}</th>
                      <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">{t('dashboard.table.change')}</th>
                      <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">{t('dashboard.table.volume')}</th>
                      <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">{t('dashboard.table.client')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {topKeywords.map((kw) => (
                      <tr key={kw.keyword} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="py-3 font-medium text-gray-900 dark:text-white">
                          {kw.keyword}
                        </td>
                        <td className="py-3">
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                            #{kw.position}
                          </span>
                        </td>
                        <td className="py-3">
                          {kw.change > 0 ? (
                            <span className="flex items-center text-emerald-600">
                              <TrendingUp className="mr-1 h-3 w-3" />+{kw.change}
                            </span>
                          ) : kw.change < 0 ? (
                            <span className="flex items-center text-rose-600">
                              <TrendingDown className="mr-1 h-3 w-3" />{kw.change}
                            </span>
                          ) : (
                            <span className="text-gray-400">--</span>
                          )}
                        </td>
                        <td className="py-3 text-gray-600 dark:text-gray-300">
                          {kw.volume.toLocaleString()}
                        </td>
                        <td className="py-3 text-gray-600 dark:text-gray-300">{kw.client}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState message={t('common.noData')} />
            )}
          </div>
        </div>

        {/* Bottom Row: Active Campaigns + Alerts */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Active Campaigns */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              {t('dashboard.activeCampaigns')}
            </h2>
            {activeCampaigns.length > 0 ? (
              <div className="space-y-4">
                {activeCampaigns.map((campaign) => (
                  <div
                    key={campaign.name}
                    className="rounded-lg border border-gray-100 p-4 dark:border-gray-700"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{campaign.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{campaign.client}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                          {campaign.type}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            campaign.status === 'On Track'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : campaign.status === 'Ahead'
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          }`}
                        >
                          {campaign.status}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>{t('dashboard.progress')}</span>
                        <span>{campaign.progress}%</span>
                      </div>
                      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                        <div
                          className="h-full rounded-full bg-blue-500 transition-all"
                          style={{ width: `${campaign.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message={t('common.noData')} />
            )}
          </div>

          {/* Alerts */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              {t('dashboard.recentAlerts')}
            </h2>
            {alertsList.length > 0 ? (
              <div className="space-y-3">
                {alertsList.map((alert) => (
                  <div
                    key={alert.id}
                    className={`rounded-lg border p-4 ${
                      alert.severity === 'critical'
                        ? 'border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-900/20'
                        : alert.severity === 'warning'
                          ? 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20'
                          : 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <AlertTriangle
                        className={`mt-0.5 h-4 w-4 flex-shrink-0 ${
                          alert.severity === 'critical'
                            ? 'text-rose-500'
                            : alert.severity === 'warning'
                              ? 'text-amber-500'
                              : 'text-blue-500'
                        }`}
                      />
                      <div>
                        <p
                          className={`text-sm font-medium ${
                            alert.severity === 'critical'
                              ? 'text-rose-800 dark:text-rose-300'
                              : alert.severity === 'warning'
                                ? 'text-amber-800 dark:text-amber-300'
                                : 'text-blue-800 dark:text-blue-300'
                          }`}
                        >
                          {alert.message}
                        </p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{alert.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message={t('common.noData')} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
