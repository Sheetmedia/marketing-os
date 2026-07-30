import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Bug, Plus, Filter, Search, AlertTriangle, CheckCircle, Clock, XCircle, ChevronDown, ChevronUp, Trash2, X } from 'lucide-react'

const API = '/api/v1'
const getHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json',
})

const MODULES = [
  'Dashboard', 'Clients', 'SEO Audit', 'Keywords', 'Backlinks', 'Competitors',
  'Content Studio', 'Image Studio', 'Social Media', 'Ads Manager', 'Campaigns',
  'Reports', 'AI Assistant', 'SEO By AI', 'Alerts', 'Settings', 'Documentation', 'Other'
]

const SEVERITIES = ['critical', 'high', 'medium', 'low']
const STATUSES = ['open', 'in_progress', 'resolved', 'closed']

const severityColors: Record<string, string> = {
  critical: 'bg-red-100 text-red-800 border-red-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-blue-100 text-blue-800 border-blue-200',
}

const statusColors: Record<string, string> = {
  open: 'bg-red-100 text-red-800 border-red-200',
  in_progress: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  resolved: 'bg-green-100 text-green-800 border-green-200',
  closed: 'bg-gray-100 text-gray-600 border-gray-200',
}

function timeAgo(dateStr: string, t: (key: string, options?: any) => string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (seconds < 60) return t('bugReport.timeAgo.justNow')
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return t('bugReport.timeAgo.minutesAgo', { count: minutes })
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return t('bugReport.timeAgo.hoursAgo', { count: hours })
  const days = Math.floor(hours / 24)
  if (days < 30) return t('bugReport.timeAgo.daysAgo', { count: days })
  const months = Math.floor(days / 30)
  return t('bugReport.timeAgo.monthsAgo', { count: months })
}

interface BugData {
  id: string
  title: string
  description: string
  module: string | null
  severity: string
  status: string
  steps_to_reproduce: string | null
  expected_behavior: string | null
  actual_behavior: string | null
  browser_info: string | null
  reported_by: string | null
  assigned_to: string | null
  resolution: string | null
  resolved_at: string | null
  created_at: string
  updated_at: string
}

interface Stats {
  total: number
  open: number
  in_progress: number
  resolved: number
  closed: number
  by_severity: Record<string, number>
  by_module: Record<string, number>
}

export default function BugReport() {
  const { t } = useTranslation()
  const [bugs, setBugs] = useState<BugData[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [showResolveDialog, setShowResolveDialog] = useState<string | null>(null)
  const [resolveText, setResolveText] = useState('')
  const [expandedBug, setExpandedBug] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  // Filters
  const [statusFilter, setStatusFilter] = useState('')
  const [severityFilter, setSeverityFilter] = useState('')
  const [moduleFilter, setModuleFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Form
  const [form, setForm] = useState({
    title: '',
    description: '',
    module: '',
    severity: 'medium',
    steps_to_reproduce: '',
    expected_behavior: '',
    actual_behavior: '',
    browser_info: typeof navigator !== 'undefined' ? navigator.userAgent : '',
  })
  const [submitting, setSubmitting] = useState(false)

  const handleAuth = (res: Response) => {
    if (res.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
      return true
    }
    return false
  }

  const fetchBugs = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      if (severityFilter) params.set('severity', severityFilter)
      if (moduleFilter) params.set('module', moduleFilter)
      if (searchQuery) params.set('search', searchQuery)
      const res = await fetch(`${API}/bugs/?${params.toString()}`, { headers: getHeaders() })
      if (handleAuth(res)) return
      if (!res.ok) throw new Error(t('bugReport.failedToFetchBugs'))
      const data = await res.json()
      setBugs(data.bugs || [])
    } catch (e: any) {
      setErrorMessage(e.message || t('bugReport.failedToLoadBugs'))
    }
  }

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API}/bugs/stats`, { headers: getHeaders() })
      if (handleAuth(res)) return
      if (!res.ok) throw new Error(t('bugReport.failedToFetchStats'))
      const data = await res.json()
      setStats(data)
    } catch {
      // silent
    }
  }

  const loadData = async () => {
    setLoading(true)
    await Promise.all([fetchBugs(), fetchStats()])
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [statusFilter, severityFilter, moduleFilter, searchQuery])

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg)
    setTimeout(() => setSuccessMessage(''), 3000)
  }

  const submitBug = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      setErrorMessage(t('bugReport.titleDescRequired'))
      return
    }
    setSubmitting(true)
    try {
      const params = new URLSearchParams()
      params.set('title', form.title)
      params.set('description', form.description)
      if (form.module) params.set('module', form.module)
      params.set('severity', form.severity)
      if (form.steps_to_reproduce) params.set('steps_to_reproduce', form.steps_to_reproduce)
      if (form.expected_behavior) params.set('expected_behavior', form.expected_behavior)
      if (form.actual_behavior) params.set('actual_behavior', form.actual_behavior)
      if (form.browser_info) params.set('browser_info', form.browser_info)

      const res = await fetch(`${API}/bugs/?${params.toString()}`, {
        method: 'POST',
        headers: getHeaders(),
      })
      if (handleAuth(res)) return
      if (!res.ok) throw new Error(t('bugReport.failedToSubmitReport'))
      setShowDialog(false)
      setForm({
        title: '', description: '', module: '', severity: 'medium',
        steps_to_reproduce: '', expected_behavior: '', actual_behavior: '',
        browser_info: navigator.userAgent,
      })
      showSuccess(t('bugReport.bugSubmitted'))
      loadData()
    } catch (e: any) {
      setErrorMessage(e.message || t('bugReport.failedToSubmitBug'))
    } finally {
      setSubmitting(false)
    }
  }

  const updateBugStatus = async (bugId: string, newStatus: string) => {
    try {
      const params = new URLSearchParams()
      params.set('status', newStatus)
      const res = await fetch(`${API}/bugs/${bugId}?${params.toString()}`, {
        method: 'PUT',
        headers: getHeaders(),
      })
      if (handleAuth(res)) return
      if (!res.ok) throw new Error(t('bugReport.failedToUpdateBug'))
      showSuccess(t('bugReport.bugMarkedAs', { status: t(`bugReport.statuses.${newStatus}`, newStatus) }))
      loadData()
    } catch (e: any) {
      setErrorMessage(e.message)
    }
  }

  const resolveBug = async (bugId: string) => {
    try {
      const params = new URLSearchParams()
      params.set('resolution', resolveText)
      const res = await fetch(`${API}/bugs/${bugId}/resolve?${params.toString()}`, {
        method: 'PUT',
        headers: getHeaders(),
      })
      if (handleAuth(res)) return
      if (!res.ok) throw new Error(t('bugReport.failedToResolveBug'))
      setShowResolveDialog(null)
      setResolveText('')
      showSuccess(t('bugReport.bugResolvedSuccess'))
      loadData()
    } catch (e: any) {
      setErrorMessage(e.message)
    }
  }

  const deleteBug = async (bugId: string) => {
    if (!confirm(t('bugReport.confirmDelete'))) return
    try {
      const res = await fetch(`${API}/bugs/${bugId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      })
      if (handleAuth(res)) return
      if (!res.ok) throw new Error(t('bugReport.failedToDeleteBug'))
      showSuccess(t('bugReport.bugDeleted'))
      loadData()
    } catch (e: any) {
      setErrorMessage(e.message)
    }
  }

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-green-800">
          <CheckCircle className="h-5 w-5" />
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage('')} className="ml-auto"><X className="h-4 w-4" /></button>
        </div>
      )}
      {errorMessage && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-800">
          <AlertTriangle className="h-5 w-5" />
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage('')} className="ml-auto"><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bug className="h-7 w-7 text-red-600" />
            {t('bugReport.title')}
          </h1>
          <p className="text-gray-500 mt-1">{t('bugReport.subtitle')}</p>
        </div>
        <button
          onClick={() => setShowDialog(true)}
          className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 transition shadow-sm"
        >
          <Plus className="h-4 w-4" />
          {t('bugReport.reportBugButton')}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100">
              <Bug className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{t('bugReport.totalBugs')}</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.total ?? 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-50">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{t('bugReport.statuses.open')}</p>
              <p className="text-2xl font-bold text-red-600">{stats?.open ?? 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-yellow-50">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{t('bugReport.statuses.in_progress')}</p>
              <p className="text-2xl font-bold text-yellow-600">{stats?.in_progress ?? 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-50">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{t('bugReport.statuses.resolved')}</p>
              <p className="text-2xl font-bold text-green-600">{stats?.resolved ?? 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-gray-500">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">{t('alerts.filters')}</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          >
            <option value="">{t('clients.allStatuses')}</option>
            {STATUSES.map(s => (
              <option key={s} value={s}>{t(`bugReport.statuses.${s}`)}</option>
            ))}
          </select>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          >
            <option value="">{t('alerts.allSeverities')}</option>
            {SEVERITIES.map(s => (
              <option key={s} value={s}>{t(`bugReport.severities.${s}`)}</option>
            ))}
          </select>
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          >
            <option value="">{t('bugReport.allModules')}</option>
            {MODULES.map(m => (
              <option key={m} value={m}>{t(`bugReport.modules.${m}`, m)}</option>
            ))}
          </select>
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={t('bugReport.searchByTitlePlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Bug List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : bugs.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center shadow-sm">
          <Bug className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('bugReport.noBugsYet')}</h3>
          <p className="text-gray-500 mb-6">{t('bugReport.noBugsYetDesc')}</p>
          <button
            onClick={() => setShowDialog(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 transition"
          >
            <Plus className="h-4 w-4" />
            {t('bugReport.reportBugButton')}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {bugs.map((bug) => (
            <div key={bug.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div
                className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50 transition"
                onClick={() => setExpandedBug(expandedBug === bug.id ? null : bug.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${severityColors[bug.severity] || severityColors.medium}`}>
                      {t(`bugReport.severities.${bug.severity}`, bug.severity)}
                    </span>
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${statusColors[bug.status] || statusColors.open}`}>
                      {t(`bugReport.statuses.${bug.status}`, bug.status)}
                    </span>
                    {bug.module && (
                      <span className="inline-flex items-center rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700">
                        {t(`bugReport.modules.${bug.module}`, bug.module)}
                      </span>
                    )}
                  </div>
                  <h3 className="font-medium text-gray-900 truncate">{bug.title}</h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span>{timeAgo(bug.created_at, t)}</span>
                    {bug.reported_by && <span>{t('bugReport.byLabel', { name: bug.reported_by })}</span>}
                  </div>
                </div>
                {expandedBug === bug.id ? (
                  <ChevronUp className="h-5 w-5 text-gray-400 flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                )}
              </div>

              {expandedBug === bug.id && (
                <div className="border-t border-gray-200 p-4 bg-gray-50 space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-1">{t('bugReport.descriptionLabel')}</h4>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{bug.description}</p>
                  </div>
                  {bug.steps_to_reproduce && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-1">{t('bugReport.stepsToReproduce')}</h4>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">{bug.steps_to_reproduce}</p>
                    </div>
                  )}
                  {bug.expected_behavior && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-1">{t('bugReport.expectedBehavior')}</h4>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">{bug.expected_behavior}</p>
                    </div>
                  )}
                  {bug.actual_behavior && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-1">{t('bugReport.actualBehavior')}</h4>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">{bug.actual_behavior}</p>
                    </div>
                  )}
                  {bug.resolution && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-1">{t('bugReport.resolutionLabel')}</h4>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">{bug.resolution}</p>
                    </div>
                  )}
                  {bug.browser_info && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-1">{t('bugReport.browserInfo')}</h4>
                      <p className="text-xs text-gray-500 break-all">{bug.browser_info}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-200 flex-wrap">
                    {bug.status === 'open' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); updateBugStatus(bug.id, 'in_progress') }}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-yellow-100 px-3 py-1.5 text-xs font-medium text-yellow-800 hover:bg-yellow-200 transition"
                      >
                        <Clock className="h-3.5 w-3.5" />
                        {t('bugReport.markInProgress')}
                      </button>
                    )}
                    {(bug.status === 'open' || bug.status === 'in_progress') && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowResolveDialog(bug.id) }}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-green-100 px-3 py-1.5 text-xs font-medium text-green-800 hover:bg-green-200 transition"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        {t('bugReport.resolve')}
                      </button>
                    )}
                    {bug.status !== 'closed' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); updateBugStatus(bug.id, 'closed') }}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 transition"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        {t('common.close')}
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteBug(bug.id) }}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-red-100 px-3 py-1.5 text-xs font-medium text-red-800 hover:bg-red-200 transition ml-auto"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {t('common.delete')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Report Bug Dialog */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Bug className="h-5 w-5 text-red-600" />
                {t('bugReport.reportBugDialogTitle')}
              </h2>
              <button onClick={() => setShowDialog(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('bugReport.titleLabel')} <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder={t('bugReport.titlePlaceholder')}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('bugReport.moduleLabel')}</label>
                  <select
                    value={form.module}
                    onChange={(e) => setForm({ ...form, module: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  >
                    <option value="">{t('bugReport.selectModule')}</option>
                    {MODULES.map(m => (
                      <option key={m} value={m}>{t(`bugReport.modules.${m}`, m)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('bugReport.severityLabel')}</label>
                  <select
                    value={form.severity}
                    onChange={(e) => setForm({ ...form, severity: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  >
                    {SEVERITIES.map(s => (
                      <option key={s} value={s}>{t(`bugReport.severities.${s}`)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('bugReport.descriptionLabel')} <span className="text-red-500">*</span></label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder={t('bugReport.descriptionPlaceholder')}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('bugReport.stepsToReproduce')}</label>
                <textarea
                  value={form.steps_to_reproduce}
                  onChange={(e) => setForm({ ...form, steps_to_reproduce: e.target.value })}
                  placeholder={t('bugReport.stepsPlaceholder')}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('bugReport.expectedBehavior')}</label>
                  <textarea
                    value={form.expected_behavior}
                    onChange={(e) => setForm({ ...form, expected_behavior: e.target.value })}
                    placeholder={t('bugReport.expectedPlaceholder')}
                    rows={2}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('bugReport.actualBehavior')}</label>
                  <textarea
                    value={form.actual_behavior}
                    onChange={(e) => setForm({ ...form, actual_behavior: e.target.value })}
                    placeholder={t('bugReport.actualPlaceholder')}
                    rows={2}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('bugReport.browserInfo')}</label>
                <input
                  type="text"
                  value={form.browser_info}
                  onChange={(e) => setForm({ ...form, browser_info: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowDialog(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={submitBug}
                disabled={submitting}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition disabled:opacity-50"
              >
                {submitting ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Bug className="h-4 w-4" />
                )}
                {t('bugReport.submitBug')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resolve Dialog */}
      {showResolveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">{t('bugReport.resolveBugTitle')}</h2>
              <button onClick={() => { setShowResolveDialog(null); setResolveText('') }} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('bugReport.resolutionLabel')}</label>
              <textarea
                value={resolveText}
                onChange={(e) => setResolveText(e.target.value)}
                placeholder={t('bugReport.resolutionPlaceholder')}
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
              />
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => { setShowResolveDialog(null); setResolveText('') }}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={() => resolveBug(showResolveDialog)}
                className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition"
              >
                <CheckCircle className="h-4 w-4" />
                {t('bugReport.markResolved')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
