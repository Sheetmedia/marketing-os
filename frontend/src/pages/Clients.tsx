import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Plus,
  Search,
  Filter,
  Eye,
  Pencil,
  ScanSearch,
  Globe,
  TrendingUp,
  Target,
  Rocket,
  Users,
  AlertTriangle,
} from 'lucide-react'

const API = '/api/v1';
const getHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json',
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ClientStatus = 'active' | 'paused' | 'archived'
type Industry = 'Technology' | 'E-commerce' | 'Healthcare' | 'Finance' | 'Sustainability' | 'SaaS'

interface Client {
  id: string
  name: string
  domain: string
  industry: Industry
  status: ClientStatus
  avatar: string
  seoScore: number
  seo_score?: number
  keywordsTracked: number
  keywords_tracked?: number
  activeCampaigns: number
  active_campaigns?: number
  organicTraffic: string
  organic_traffic?: string
}

const industries: Industry[] = ['Technology', 'E-commerce', 'Healthcare', 'Finance', 'Sustainability', 'SaaS']
const statuses: ClientStatus[] = ['active', 'paused', 'archived']

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function statusStyles(status: ClientStatus) {
  switch (status) {
    case 'active':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
    case 'paused':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
    case 'archived':
      return 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
  }
}

function industryColor(industry: string) {
  const map: Record<string, string> = {
    Technology: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'E-commerce': 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
    Healthcare: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
    Finance: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    Sustainability: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
    SaaS: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  }
  return map[industry] ?? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
}

function scoreColor(score: number) {
  if (score >= 80) return 'text-emerald-600 dark:text-emerald-400'
  if (score >= 60) return 'text-amber-600 dark:text-amber-400'
  return 'text-rose-600 dark:text-rose-400'
}

// ---------------------------------------------------------------------------
// Clients Page
// ---------------------------------------------------------------------------

export default function Clients() {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<ClientStatus | 'all'>('all')
  const [filterIndustry, setFilterIndustry] = useState<Industry | 'all'>('all')
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newClient, setNewClient] = useState({ name: '', domain: '', industry: 'Technology', marketing_goals: '' })
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [editData, setEditData] = useState({ name: '', domain: '', industry: 'Technology', marketing_goals: '' })
  const [editError, setEditError] = useState('')
  const [saving, setSaving] = useState(false)
  const [auditMessage, setAuditMessage] = useState<string | null>(null)

  const fetchClients = () => {
    setLoading(true)
    setError(null)
    fetch(`${API}/clients/`, { headers: getHeaders() })
      .then(r => {
        if (r.status === 401) { localStorage.removeItem('token'); window.location.href = '/login'; return null; }
        if (!r.ok) throw new Error(`Error: ${r.status}`)
        return r.json();
      })
      .then(d => {
        if (!d) return;
        const clientList = d.clients || d || [];
        setClients(Array.isArray(clientList) ? clientList : []);
      })
      .catch((err) => {
        setClients([])
        setError(err.message || t('clients.failedToLoadGeneric'))
      })
      .finally(() => setLoading(false));
  }

  const [createError, setCreateError] = useState('')

  const handleCreateClient = async () => {
    if (!newClient.name || !newClient.domain) return
    setCreating(true)
    setCreateError('')
    try {
      const params = new URLSearchParams({
        name: newClient.name,
        domain: newClient.domain,
        industry: newClient.industry,
        marketing_goals: newClient.marketing_goals,
      })
      const res = await fetch(`${API}/clients/?${params}`, { method: 'POST', headers: getHeaders() })
      if (res.ok) {
        setShowAddDialog(false)
        setNewClient({ name: '', domain: '', industry: 'Technology', marketing_goals: '' })
        fetchClients()
      } else if (res.status === 401) {
        localStorage.removeItem('token')
        setCreateError(t('common.sessionExpired'))
        window.location.href = '/login'
      } else {
        const err = await res.json().catch(() => ({}))
        setCreateError(err.detail || `Error: ${res.status}`)
      }
    } catch (err: any) {
      setCreateError(err.message || t('common.networkError'))
    }
    finally { setCreating(false) }
  }

  const handleEditClient = async () => {
    if (!editingClient || !editData.name || !editData.domain) return
    setSaving(true)
    setEditError('')
    try {
      const res = await fetch(`${API}/clients/${editingClient.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          name: editData.name,
          domain: editData.domain,
          industry: editData.industry,
          marketing_goals: editData.marketing_goals,
        }),
      })
      if (res.ok) {
        setShowEditDialog(false)
        setEditingClient(null)
        fetchClients()
      } else if (res.status === 401) {
        localStorage.removeItem('token')
        setEditError(t('common.sessionExpired'))
        window.location.href = '/login'
      } else {
        const err = await res.json().catch(() => ({}))
        setEditError(err.detail || `Error: ${res.status}`)
      }
    } catch (err: any) {
      setEditError(err.message || t('common.networkError'))
    } finally {
      setSaving(false)
    }
  }

  const handleAudit = async (clientId: string) => {
    setAuditMessage(null)
    try {
      const res = await fetch(`${API}/seo/${clientId}/audit`, {
        method: 'POST',
        headers: getHeaders(),
      })
      if (res.status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/login'
        return
      }
      if (res.ok) {
        setAuditMessage(t('clients.auditStarted'))
      } else {
        const err = await res.json().catch(() => ({}))
        setAuditMessage(err.detail || t('clients.auditFailed', { status: res.status }))
      }
    } catch (err: any) {
      setAuditMessage(err.message || t('clients.auditStartFailed'))
    }
    setTimeout(() => setAuditMessage(null), 4000)
  }

  const openEditDialog = (client: Client) => {
    setEditingClient(client)
    setEditData({
      name: client.name || '',
      domain: client.domain || '',
      industry: client.industry || 'Technology',
      marketing_goals: '',
    })
    setEditError('')
    setShowEditDialog(true)
  }

  useEffect(() => {
    fetchClients();
  }, [])

  const filtered = clients.filter((c) => {
    const matchName = c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.domain?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchStatus = filterStatus === 'all' || c.status === filterStatus
    const matchIndustry = filterIndustry === 'all' || c.industry === filterIndustry
    return matchName && matchStatus && matchIndustry
  })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Audit toast message */}
        {auditMessage && (
          <div className="fixed top-4 right-4 z-50 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 shadow-lg dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
            {auditMessage}
          </div>
        )}

        {/* Page Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('clients.title')}</h1>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              {t('clients.subtitle')}
            </p>
          </div>
          <button onClick={() => setShowAddDialog(true)} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            <Plus className="h-4 w-4" />
            {t('clients.addClient')}
          </button>
        </div>

        {/* Add Client Dialog */}
        {showAddDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800">
              <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">{t('clients.addNewClient')}</h2>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('clients.companyName')}</label>
                  <input value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})} placeholder={t('clients.companyNamePlaceholder')} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('clients.websiteDomain')}</label>
                  <input value={newClient.domain} onChange={e => setNewClient({...newClient, domain: e.target.value})} placeholder={t('clients.websiteDomainPlaceholder')} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('clients.industry')}</label>
                  <select value={newClient.industry} onChange={e => setNewClient({...newClient, industry: e.target.value})} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                    {industries.map(i => <option key={i} value={i}>{t(`industries.${i}`)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('clients.marketingGoals')}</label>
                  <textarea value={newClient.marketing_goals} onChange={e => setNewClient({...newClient, marketing_goals: e.target.value})} rows={3} placeholder={t('clients.marketingGoalsPlaceholder')} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                </div>
              </div>
              {createError && (
                <div className="mt-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-600 dark:bg-red-900/20 dark:text-red-400">{createError}</div>
              )}
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => { setShowAddDialog(false); setCreateError(''); }} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">{t('common.cancel')}</button>
                <button onClick={handleCreateClient} disabled={creating || !newClient.name || !newClient.domain} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                  {creating ? t('common.creating') : t('clients.createClient')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Client Dialog */}
        {showEditDialog && editingClient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800">
              <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">{t('clients.editClient')}</h2>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('clients.companyName')}</label>
                  <input value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} placeholder={t('clients.companyNamePlaceholder')} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('clients.websiteDomain')}</label>
                  <input value={editData.domain} onChange={e => setEditData({...editData, domain: e.target.value})} placeholder={t('clients.websiteDomainPlaceholder')} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('clients.industry')}</label>
                  <select value={editData.industry} onChange={e => setEditData({...editData, industry: e.target.value})} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                    {industries.map(i => <option key={i} value={i}>{t(`industries.${i}`)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('clients.marketingGoals')}</label>
                  <textarea value={editData.marketing_goals} onChange={e => setEditData({...editData, marketing_goals: e.target.value})} rows={3} placeholder={t('clients.marketingGoalsPlaceholder')} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                </div>
              </div>
              {editError && (
                <div className="mt-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-600 dark:bg-red-900/20 dark:text-red-400">{editError}</div>
              )}
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => { setShowEditDialog(false); setEditingClient(null); setEditError(''); }} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">{t('common.cancel')}</button>
                <button onClick={handleEditClient} disabled={saving || !editData.name || !editData.domain} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                  {saving ? t('common.saving') : t('common.saveChanges')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search & Filter Bar */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t('clients.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as ClientStatus | 'all')}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
              >
                <option value="all">{t('clients.allStatuses')}</option>
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {t(`common.${s}`)}
                  </option>
                ))}
              </select>
            </div>
            <select
              value={filterIndustry}
              onChange={(e) => setFilterIndustry(e.target.value as Industry | 'all')}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
            >
              <option value="all">{t('clients.allIndustries')}</option>
              {industries.map((i) => (
                <option key={i} value={i}>{t(`industries.${i}`)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 py-16 shadow-sm dark:border-red-800 dark:bg-red-900/20">
            <AlertTriangle className="mb-4 h-12 w-12 text-red-400" />
            <h3 className="text-lg font-medium text-red-700 dark:text-red-300">{t('clients.failedToLoad')}</h3>
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
            <button onClick={fetchClients} className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
              {t('common.tryAgainButton')}
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && clients.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('clients.noClientsYet')}</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t('clients.noClientsDesc')}
            </p>
          </div>
        )}

        {/* Client Cards Grid */}
        {!loading && !error && clients.length > 0 && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((client) => {
              const seoScore = client.seo_score || client.seoScore || 0
              const keywordsTracked = client.keywords_tracked || client.keywordsTracked || 0
              const activeCampaigns = client.active_campaigns || client.activeCampaigns || 0

              return (
                <div
                  key={client.id}
                  className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
                >
                  {/* Top Row: Avatar, Name, Status */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-sm font-bold text-white">
                        {client.avatar || client.name?.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{client.name}</h3>
                        <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                          <Globe className="h-3 w-3" />
                          {client.domain}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="mt-4 flex items-center gap-2">
                    {client.status && (
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${statusStyles(client.status)}`}>
                        {t(`common.${client.status}`)}
                      </span>
                    )}
                    {client.industry && (
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${industryColor(client.industry)}`}>
                        {t(`industries.${client.industry}`)}
                      </span>
                    )}
                  </div>

                  {/* Key Metrics */}
                  <div className="mt-5 grid grid-cols-3 divide-x divide-gray-100 dark:divide-gray-700">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Target className="h-3.5 w-3.5 text-gray-400" />
                      </div>
                      <p className={`mt-1 text-lg font-bold ${scoreColor(seoScore)}`}>
                        {seoScore}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t('clients.seoScore')}</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <TrendingUp className="h-3.5 w-3.5 text-gray-400" />
                      </div>
                      <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
                        {keywordsTracked}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t('clients.keywords')}</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Rocket className="h-3.5 w-3.5 text-gray-400" />
                      </div>
                      <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
                        {activeCampaigns}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t('clients.campaigns')}</p>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="mt-5 flex items-center gap-2 border-t border-gray-100 pt-4 dark:border-gray-700">
                    <button
                      onClick={() => window.location.href = '/clients/' + client.id}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      {t('common.view')}
                    </button>
                    <button
                      onClick={() => openEditDialog(client)}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      {t('common.edit')}
                    </button>
                    <button
                      onClick={() => handleAudit(client.id)}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 transition hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
                    >
                      <ScanSearch className="h-3.5 w-3.5" />
                      {t('common.audit')}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* No results from filter */}
        {!loading && !error && clients.length > 0 && filtered.length === 0 && (
          <div className="mt-12 text-center">
            <Search className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              {t('clients.noClientsFound')}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t('clients.noClientsFoundDesc')}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
