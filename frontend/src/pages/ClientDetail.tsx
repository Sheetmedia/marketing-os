import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  Globe,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Link2,
  BarChart3,
  Target,
  Shield,
  ArrowLeft,
  Palette,
  Type,
  Crosshair,
  Users,
  AlertTriangle,
  FileText,
  Rocket,
  Search,
} from 'lucide-react'

const API = '/api/v1';
const getHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json',
});

async function apiFetch(url: string) {
  const r = await fetch(url, { headers: getHeaders() });
  if (r.status === 401) { localStorage.removeItem('token'); window.location.href = '/login'; return null; }
  if (!r.ok) throw new Error(`Error: ${r.status}`);
  return r.json();
}

const tabs = ['Overview', 'SEO', 'Keywords', 'Backlinks', 'Content', 'Campaigns', 'Reports'] as const
type Tab = (typeof tabs)[number]

function statusStyles(status: string) {
  switch (status) {
    case 'active':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
    case 'paused':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
    case 'archived':
      return 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
    default:
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
  }
}

// ---------------------------------------------------------------------------
// Client Detail Page
// ---------------------------------------------------------------------------

export default function ClientDetail() {
  const { t } = useTranslation()
  const { clientId: id } = useParams<{ clientId: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState<Tab>('Overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [clientData, setClientData] = useState<any>(null)
  const [dashboard, setDashboard] = useState<any>(null)

  // Tab data states
  const [seoData, setSeoData] = useState<{ audits: any[]; metrics: any[] } | null>(null)
  const [keywordsData, setKeywordsData] = useState<any[] | null>(null)
  const [backlinksData, setBacklinksData] = useState<any[] | null>(null)
  const [contentData, setContentData] = useState<any[] | null>(null)
  const [campaignsData, setCampaignsData] = useState<any[] | null>(null)
  const [reportsData, setReportsData] = useState<any[] | null>(null)
  const [tabLoading, setTabLoading] = useState(false)
  const [tabError, setTabError] = useState<string | null>(null)

  // Edit dialog state
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editData, setEditData] = useState({ name: '', domain: '', industry: 'Technology', marketing_goals: '' })
  const [editError, setEditError] = useState('')
  const [saving, setSaving] = useState(false)

  // Audit state
  const [auditMessage, setAuditMessage] = useState<string | null>(null)

  // Google Search Console integration state
  const [gscStatus, setGscStatus] = useState<{ connected: boolean; site_url?: string | null } | null>(null)
  const [gscSites, setGscSites] = useState<any[]>([])
  const [gscAnalytics, setGscAnalytics] = useState<any>(null)
  const [gscLoading, setGscLoading] = useState(false)
  const [gscError, setGscError] = useState<string | null>(null)
  const [gscNotice, setGscNotice] = useState<string | null>(null)

  const industries = ['Technology', 'E-commerce', 'Healthcare', 'Finance', 'Sustainability', 'SaaS']

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    Promise.all([
      apiFetch(`${API}/clients/${id}`),
      apiFetch(`${API}/clients/${id}/dashboard`),
    ]).then(([clientRes, dashboardRes]) => {
      setClientData(clientRes);
      setDashboard(dashboardRes);
    }).catch((err) => {
      setError(err.message || t('clientDetail.failedToLoadClientData'))
    }).finally(() => setLoading(false));
  }, [id]);

  // Google Search Console: load connection status, and surface redirect result once.
  useEffect(() => {
    if (!id) return;
    apiFetch(`${API}/integrations/google/${id}/status`)
      .then((data) => { if (data) setGscStatus(data) })
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    if (searchParams.get('gsc_connected')) {
      setGscNotice(t('clientDetail.gscConnectedSuccess'));
      const next = new URLSearchParams(searchParams);
      next.delete('gsc_connected');
      setSearchParams(next, { replace: true });
    } else if (searchParams.get('gsc_error')) {
      setGscError(t('clientDetail.gscConnectFailed'));
      const next = new URLSearchParams(searchParams);
      next.delete('gsc_error');
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadGscSites = async () => {
    if (!id) return;
    setGscLoading(true);
    try {
      const data = await apiFetch(`${API}/integrations/google/${id}/sites`);
      setGscSites(data?.sites || []);
    } catch {
      // leave sites empty; user can retry the connect flow
    } finally {
      setGscLoading(false);
    }
  };

  const loadGscAnalytics = async () => {
    if (!id) return;
    setGscLoading(true);
    setGscError(null);
    try {
      const data = await apiFetch(`${API}/integrations/google/${id}/analytics`);
      setGscAnalytics(data);
    } catch (err: any) {
      setGscError(err.message || t('clientDetail.gscLoadFailed'));
    } finally {
      setGscLoading(false);
    }
  };

  useEffect(() => {
    if (!gscStatus?.connected) return;
    if (gscStatus.site_url) loadGscAnalytics();
    else loadGscSites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gscStatus?.connected, gscStatus?.site_url]);

  const handleConnectGsc = async () => {
    if (!id) return;
    setGscError(null);
    try {
      const res = await fetch(`${API}/integrations/google/auth-url?client_id=${id}`, { headers: getHeaders() });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setGscError(data.detail || t('clientDetail.gscOAuthNotConfigured'));
        return;
      }
      window.location.href = data.url;
    } catch (err: any) {
      setGscError(err.message || t('clientDetail.gscConnectStartFailed'));
    }
  };

  const handleSelectGscSite = async (siteUrl: string) => {
    if (!id) return;
    await fetch(`${API}/integrations/google/${id}/site?site_url=${encodeURIComponent(siteUrl)}`, {
      method: 'PUT',
      headers: getHeaders(),
    });
    setGscStatus((s) => (s ? { ...s, site_url: siteUrl } : s));
  };

  // Fetch tab data when tab changes
  useEffect(() => {
    if (!id || activeTab === 'Overview') return;

    const fetchTabData = async () => {
      setTabLoading(true);
      setTabError(null);
      try {
        switch (activeTab) {
          case 'SEO': {
            if (seoData) { setTabLoading(false); return; }
            const [audits, metrics] = await Promise.all([
              apiFetch(`${API}/seo/${id}/audits`).catch(() => []),
              apiFetch(`${API}/seo/${id}/metrics`).catch(() => []),
            ]);
            setSeoData({ audits: audits?.audits || audits || [], metrics: metrics?.metrics || metrics || [] });
            break;
          }
          case 'Keywords': {
            if (keywordsData) { setTabLoading(false); return; }
            const kw = await apiFetch(`${API}/keywords/${id}/keywords`).catch(() => []);
            setKeywordsData(kw?.keywords || kw || []);
            break;
          }
          case 'Backlinks': {
            if (backlinksData) { setTabLoading(false); return; }
            const bl = await apiFetch(`${API}/backlinks/${id}/backlinks`).catch(() => []);
            setBacklinksData(bl?.backlinks || bl || []);
            break;
          }
          case 'Content': {
            if (contentData) { setTabLoading(false); return; }
            const ct = await apiFetch(`${API}/content/${id}/content`).catch(() => []);
            setContentData(ct?.content || ct || []);
            break;
          }
          case 'Campaigns': {
            if (campaignsData) { setTabLoading(false); return; }
            const cp = await apiFetch(`${API}/campaigns/?client_id=${id}`).catch(() => []);
            setCampaignsData(cp?.campaigns || cp || []);
            break;
          }
          case 'Reports': {
            if (reportsData) { setTabLoading(false); return; }
            const rp = await apiFetch(`${API}/reports/${id}/reports`).catch(() => []);
            setReportsData(rp?.reports || rp || []);
            break;
          }
        }
      } catch (err: any) {
        setTabError(err.message || t('clientDetail.failedToLoadTabData', { tab: activeTab }));
      } finally {
        setTabLoading(false);
      }
    };

    fetchTabData();
  }, [id, activeTab]);

  const handleEditClient = async () => {
    if (!id || !editData.name || !editData.domain) return
    setSaving(true)
    setEditError('')
    try {
      const res = await fetch(`${API}/clients/${id}`, {
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
        const updated = await res.json().catch(() => null)
        if (updated) setClientData(updated)
        setShowEditDialog(false)
      } else if (res.status === 401) {
        localStorage.removeItem('token')
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

  const openEditDialog = () => {
    if (!clientData) return
    setEditData({
      name: clientData.name || '',
      domain: clientData.domain || '',
      industry: clientData.industry || 'Technology',
      marketing_goals: clientData.marketing_goals || '',
    })
    setEditError('')
    setShowEditDialog(true)
  }

  const handleRunAudit = async () => {
    if (!id) return
    setAuditMessage(null)
    try {
      const res = await fetch(`${API}/seo/${id}/audit`, {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate('/clients')}
            className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 transition hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Clients
          </button>
          <div className="flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 py-16 shadow-sm dark:border-red-800 dark:bg-red-900/20">
            <AlertTriangle className="mb-4 h-12 w-12 text-red-400" />
            <h3 className="text-lg font-medium text-red-700 dark:text-red-300">{t('clientDetail.failedToLoadClient')}</h3>
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              {t('common.tryAgainButton')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!clientData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate('/clients')}
            className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 transition hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Clients
          </button>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('clientDetail.clientNotFound')}</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t('clientDetail.clientNotFoundDesc')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const overviewStats = dashboard?.stats || [];
  const trafficHistory = dashboard?.traffic_history || [];
  const recentKeywords = dashboard?.recent_keywords || [];
  const brandKit = dashboard?.brand_kit || { colors: [], fonts: [], goals: [] };
  const competitors = dashboard?.competitors || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Audit toast message */}
        {auditMessage && (
          <div className="fixed top-4 right-4 z-50 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 shadow-lg dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
            {auditMessage}
          </div>
        )}

        {/* Edit Client Dialog */}
        {showEditDialog && (
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
                <button onClick={() => { setShowEditDialog(false); setEditError(''); }} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">{t('common.cancel')}</button>
                <button onClick={handleEditClient} disabled={saving || !editData.name || !editData.domain} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                  {saving ? t('common.saving') : t('common.saveChanges')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Back Button */}
        <button
          onClick={() => navigate('/clients')}
          className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 transition hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('clientDetail.backToClients')}
        </button>

        {/* Client Header */}
        <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 text-xl font-bold text-white">
                {clientData.avatar || clientData.name?.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {clientData.name}
                  </h1>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusStyles(clientData.status || 'active')}`}>
                    {t(`common.${clientData.status || 'active'}`)}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <a
                    href={`https://${clientData.domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    {clientData.domain}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  {clientData.industry && <span>{t(`industries.${clientData.industry}`)}</span>}
                  {clientData.joinedDate && <span>{t('clientDetail.clientSince', { date: clientData.joinedDate })}</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={openEditDialog}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {t('clients.editClient')}
              </button>
              <button
                onClick={handleRunAudit}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                {t('clientDetail.runAudit')}
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex gap-6 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap border-b-2 px-1 pb-3 text-sm font-medium transition ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {t(`clientDetail.tabs.${tab}`)}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content - Overview */}
        {activeTab === 'Overview' && (
          <div className="space-y-8">
            {/* Stats Row */}
            {overviewStats.length > 0 && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {overviewStats.map((stat: any) => (
                  <div
                    key={stat.label}
                    className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {stat.label}
                      </p>
                    </div>
                    <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                      {stat.value}
                    </p>
                    {stat.change && (
                      <p className="mt-1 flex items-center text-sm text-emerald-600">
                        <TrendingUp className="mr-1 h-3 w-3" />
                        {t('clientDetail.vsLastMonth', { change: stat.change })}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Traffic Chart */}
            {trafficHistory.length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                  {t('clientDetail.organicTraffic')}
                </h2>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trafficHistory}>
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
                      <Line
                        type="monotone"
                        dataKey="traffic"
                        stroke="#3b82f6"
                        strokeWidth={2.5}
                        dot={{ fill: '#3b82f6', r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Recent Keywords + Brand Kit */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Recent Keywords */}
              {recentKeywords.length > 0 && (
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                  <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                    {t('clientDetail.recentKeywords')}
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">{t('dashboard.table.keyword')}</th>
                          <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">{t('dashboard.table.position')}</th>
                          <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">{t('dashboard.table.change')}</th>
                          <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">{t('dashboard.table.volume')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {recentKeywords.map((kw: any) => (
                          <tr key={kw.keyword} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <td className="py-2.5 font-medium text-gray-900 dark:text-white">
                              {kw.keyword}
                            </td>
                            <td className="py-2.5">
                              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                #{kw.position}
                              </span>
                            </td>
                            <td className="py-2.5">
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
                            <td className="py-2.5 text-gray-600 dark:text-gray-300">
                              {(kw.volume || 0).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Brand Kit + Competitors */}
              <div className="space-y-6">
                {(brandKit.colors?.length > 0 || brandKit.fonts?.length > 0 || brandKit.goals?.length > 0) && (
                  <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                      {t('clientDetail.brandKit')}
                    </h2>
                    {brandKit.colors?.length > 0 && (
                      <div className="mb-5">
                        <p className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                          <Palette className="h-4 w-4" /> {t('clientDetail.brandColors')}
                        </p>
                        <div className="flex gap-2">
                          {brandKit.colors.map((color: string) => (
                            <div key={color} className="group relative">
                              <div
                                className="h-10 w-10 rounded-lg border border-gray-200 shadow-sm dark:border-gray-600"
                                style={{ backgroundColor: color }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {brandKit.fonts?.length > 0 && (
                      <div className="mb-5">
                        <p className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                          <Type className="h-4 w-4" /> {t('clientDetail.fonts')}
                        </p>
                        <div className="flex gap-2">
                          {brandKit.fonts.map((font: string) => (
                            <span
                              key={font}
                              className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
                            >
                              {font}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {brandKit.goals?.length > 0 && (
                      <div>
                        <p className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                          <Crosshair className="h-4 w-4" /> {t('clientDetail.goals')}
                        </p>
                        <ul className="space-y-2">
                          {brandKit.goals.map((goal: string) => (
                            <li
                              key={goal}
                              className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
                            >
                              <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
                              {goal}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {competitors.length > 0 && (
                  <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                      <Users className="h-5 w-5" /> {t('clientDetail.competitors')}
                    </h2>
                    <div className="space-y-3">
                      {competitors.map((comp: any) => (
                        <div
                          key={comp.name}
                          className="flex items-center justify-between rounded-lg border border-gray-100 p-3 dark:border-gray-700"
                        >
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{comp.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{comp.domain}</p>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="text-center">
                              <p className="font-semibold text-gray-900 dark:text-white">{comp.da}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{t('clientDetail.domainAuthorityAbbr')}</p>
                            </div>
                            <div className="text-center">
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {comp.traffic}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{t('clientDetail.traffic')}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Empty state when no dashboard data */}
            {overviewStats.length === 0 && trafficHistory.length === 0 && recentKeywords.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <BarChart3 className="h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('clientDetail.noDashboardData')}</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {t('clientDetail.noDashboardDataDesc')}
                </p>
              </div>
            )}
          </div>
        )}

        {/* SEO Tab */}
        {activeTab === 'SEO' && (
          <div className="space-y-6">
            {/* Google Search Console */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                  <Globe className="h-5 w-5" /> {t('clientDetail.googleSearchConsole')}
                </h2>
                {gscStatus?.connected && (
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    {t('clientDetail.connected')}
                  </span>
                )}
              </div>

              {gscNotice && (
                <div className="mb-4 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                  {gscNotice}
                </div>
              )}
              {gscError && (
                <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-600 dark:bg-red-900/20 dark:text-red-400">
                  {gscError}
                </div>
              )}

              {!gscStatus?.connected && (
                <div className="py-4 text-center">
                  <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                    {t('clientDetail.connectGscDesc')}
                  </p>
                  <button
                    onClick={handleConnectGsc}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    {t('clientDetail.connectGsc')}
                  </button>
                </div>
              )}

              {gscStatus?.connected && !gscStatus.site_url && (
                <div>
                  <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
                    {t('clientDetail.selectGscProperty')}
                  </p>
                  {gscLoading ? (
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                  ) : gscSites.length > 0 ? (
                    <div className="space-y-2">
                      {gscSites.map((s: any) => (
                        <button
                          key={s.siteUrl}
                          onClick={() => handleSelectGscSite(s.siteUrl)}
                          className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-left text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
                        >
                          {s.siteUrl}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">{t('clientDetail.noVerifiedProperties')}</p>
                  )}
                </div>
              )}

              {gscStatus?.connected && gscStatus.site_url && (
                gscLoading ? (
                  <div className="flex justify-center py-6">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                  </div>
                ) : gscAnalytics ? (
                  <div>
                    <p className="mb-3 text-xs text-gray-400">
                      {gscAnalytics.site_url} · {t('clientDetail.lastDaysRealData')}
                    </p>
                    <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t('clientDetail.clicks')}</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">{gscAnalytics.summary.clicks.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t('clientDetail.impressions')}</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">{gscAnalytics.summary.impressions.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t('clientDetail.ctr')}</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">{(gscAnalytics.summary.ctr * 100).toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t('clientDetail.avgPosition')}</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">{gscAnalytics.summary.position.toFixed(1)}</p>
                      </div>
                    </div>
                    {gscAnalytics.top_queries?.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                              <th className="pb-2 font-medium text-gray-500 dark:text-gray-400">{t('clientDetail.query')}</th>
                              <th className="pb-2 font-medium text-gray-500 dark:text-gray-400">{t('clientDetail.clicks')}</th>
                              <th className="pb-2 font-medium text-gray-500 dark:text-gray-400">{t('dashboard.table.position')}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {gscAnalytics.top_queries.slice(0, 10).map((q: any) => (
                              <tr key={q.query}>
                                <td className="py-2 text-gray-900 dark:text-white">{q.query}</td>
                                <td className="py-2 text-gray-600 dark:text-gray-300">{q.clicks}</td>
                                <td className="py-2 text-gray-600 dark:text-gray-300">{q.position.toFixed(1)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : null
              )}
            </div>

            {tabLoading && (
              <div className="flex items-center justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
              </div>
            )}
            {tabError && (
              <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-600 dark:bg-red-900/20 dark:text-red-400">{tabError}</div>
            )}
            {!tabLoading && !tabError && seoData && (
              <>
                {/* Latest Audit Score */}
                {seoData.audits.length > 0 && (
                  <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{t('clientDetail.latestAudit')}</h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      {seoData.audits.slice(0, 1).map((audit: any, idx: number) => (
                        <React.Fragment key={idx}>
                          <div className="rounded-lg border border-gray-100 p-4 dark:border-gray-700">
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('clientDetail.overallScore')}</p>
                            <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">{audit.score || audit.seo_score || '--'}</p>
                          </div>
                          <div className="rounded-lg border border-gray-100 p-4 dark:border-gray-700">
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('clientDetail.performance')}</p>
                            <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">{audit.performance_score || '--'}</p>
                          </div>
                          <div className="rounded-lg border border-gray-100 p-4 dark:border-gray-700">
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('clientDetail.issuesFound')}</p>
                            <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">{audit.issues_count || audit.issues || '--'}</p>
                          </div>
                          <div className="rounded-lg border border-gray-100 p-4 dark:border-gray-700">
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('common.date')}</p>
                            <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{audit.created_at ? new Date(audit.created_at).toLocaleDateString() : audit.date || '--'}</p>
                          </div>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}

                {/* Metrics Chart */}
                {seoData.metrics.length > 0 && (
                  <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{t('clientDetail.seoMetricsOverTime')}</h2>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={seoData.metrics}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                          <YAxis stroke="#9ca3af" fontSize={12} />
                          <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#f9fafb' }} />
                          <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2.5} dot={{ fill: '#3b82f6', r: 4 }} activeDot={{ r: 6 }} name="SEO Score" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Audit History Table */}
                {seoData.audits.length > 1 && (
                  <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{t('clientDetail.auditHistory')}</h2>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">{t('common.date')}</th>
                            <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">{t('clientDetail.score')}</th>
                            <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">{t('clientDetail.issues')}</th>
                            <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">{t('common.status')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                          {seoData.audits.map((audit: any, idx: number) => (
                            <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                              <td className="py-2.5 text-gray-900 dark:text-white">{audit.created_at ? new Date(audit.created_at).toLocaleDateString() : audit.date || '--'}</td>
                              <td className="py-2.5 font-semibold text-gray-900 dark:text-white">{audit.score || audit.seo_score || '--'}</td>
                              <td className="py-2.5 text-gray-600 dark:text-gray-300">{audit.issues_count || audit.issues || '--'}</td>
                              <td className="py-2.5"><span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">{t(`common.${audit.status || 'completed'}`)}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {seoData.audits.length === 0 && seoData.metrics.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Shield className="h-12 w-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('clientDetail.noSeoData')}</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('clientDetail.noSeoDataDesc')}</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Keywords Tab */}
        {activeTab === 'Keywords' && (
          <div>
            {tabLoading && (
              <div className="flex items-center justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
              </div>
            )}
            {tabError && (
              <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-600 dark:bg-red-900/20 dark:text-red-400">{tabError}</div>
            )}
            {!tabLoading && !tabError && keywordsData && (
              keywordsData.length > 0 ? (
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                  <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{t('clientDetail.trackedKeywords')}</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">{t('dashboard.table.keyword')}</th>
                          <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">{t('dashboard.table.position')}</th>
                          <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">{t('dashboard.table.change')}</th>
                          <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">{t('dashboard.table.volume')}</th>
                          <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">{t('clientDetail.difficulty')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {keywordsData.map((kw: any, idx: number) => (
                          <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <td className="py-2.5 font-medium text-gray-900 dark:text-white">{kw.keyword}</td>
                            <td className="py-2.5">
                              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                #{kw.position || kw.current_position || '--'}
                              </span>
                            </td>
                            <td className="py-2.5">
                              {(kw.change || 0) > 0 ? (
                                <span className="flex items-center text-emerald-600"><TrendingUp className="mr-1 h-3 w-3" />+{kw.change}</span>
                              ) : (kw.change || 0) < 0 ? (
                                <span className="flex items-center text-rose-600"><TrendingDown className="mr-1 h-3 w-3" />{kw.change}</span>
                              ) : (
                                <span className="text-gray-400">--</span>
                              )}
                            </td>
                            <td className="py-2.5 text-gray-600 dark:text-gray-300">{(kw.volume || kw.search_volume || 0).toLocaleString()}</td>
                            <td className="py-2.5 text-gray-600 dark:text-gray-300">{kw.difficulty || kw.keyword_difficulty || '--'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Search className="h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('clientDetail.noKeywordsTracked')}</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('clientDetail.noKeywordsTrackedDesc')}</p>
                </div>
              )
            )}
          </div>
        )}

        {/* Backlinks Tab */}
        {activeTab === 'Backlinks' && (
          <div>
            {tabLoading && (
              <div className="flex items-center justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
              </div>
            )}
            {tabError && (
              <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-600 dark:bg-red-900/20 dark:text-red-400">{tabError}</div>
            )}
            {!tabLoading && !tabError && backlinksData && (
              backlinksData.length > 0 ? (
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                  <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{t('clientDetail.backlinksTitle')}</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">{t('clientDetail.sourceUrl')}</th>
                          <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">{t('clientDetail.targetUrl')}</th>
                          <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">{t('clientDetail.domainAuthorityAbbr')}</th>
                          <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">{t('common.type')}</th>
                          <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">{t('common.status')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {backlinksData.map((bl: any, idx: number) => (
                          <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <td className="py-2.5 text-gray-900 dark:text-white max-w-xs truncate">
                              <a href={bl.source_url || bl.sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 dark:hover:text-blue-400">{bl.source_url || bl.sourceUrl || '--'}</a>
                            </td>
                            <td className="py-2.5 text-gray-600 dark:text-gray-300 max-w-xs truncate">{bl.target_url || bl.targetUrl || '--'}</td>
                            <td className="py-2.5 font-semibold text-gray-900 dark:text-white">{bl.domain_authority || bl.da || '--'}</td>
                            <td className="py-2.5 text-gray-600 dark:text-gray-300">{bl.link_type || bl.type || '--'}</td>
                            <td className="py-2.5">
                              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${(bl.status === 'active' || bl.status === 'live') ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
                                {bl.status || '--'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Link2 className="h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('clientDetail.noBacklinksFound')}</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('clientDetail.noBacklinksFoundDesc')}</p>
                </div>
              )
            )}
          </div>
        )}

        {/* Content Tab */}
        {activeTab === 'Content' && (
          <div>
            {tabLoading && (
              <div className="flex items-center justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
              </div>
            )}
            {tabError && (
              <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-600 dark:bg-red-900/20 dark:text-red-400">{tabError}</div>
            )}
            {!tabLoading && !tabError && contentData && (
              contentData.length > 0 ? (
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                  <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{t('clientDetail.contentTitle')}</h2>
                  <div className="space-y-4">
                    {contentData.map((item: any, idx: number) => (
                      <div key={idx} className="rounded-lg border border-gray-100 p-4 dark:border-gray-700">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-white">{item.title || item.name || t('clientDetail.untitled')}</h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{item.content_type || item.type || t('clientDetail.article')} {item.created_at ? ' - ' + new Date(item.created_at).toLocaleDateString() : ''}</p>
                          </div>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${item.status === 'published' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : item.status === 'draft' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
                            {t(`common.${item.status || 'draft'}`)}
                          </span>
                        </div>
                        {item.summary && <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{item.summary}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <FileText className="h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('clientDetail.noContentYet')}</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('clientDetail.noContentYetDesc')}</p>
                </div>
              )
            )}
          </div>
        )}

        {/* Campaigns Tab */}
        {activeTab === 'Campaigns' && (
          <div>
            {tabLoading && (
              <div className="flex items-center justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
              </div>
            )}
            {tabError && (
              <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-600 dark:bg-red-900/20 dark:text-red-400">{tabError}</div>
            )}
            {!tabLoading && !tabError && campaignsData && (
              campaignsData.length > 0 ? (
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                  <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{t('clientDetail.campaignsTitle')}</h2>
                  <div className="space-y-4">
                    {campaignsData.map((campaign: any, idx: number) => (
                      <div key={idx} className="rounded-lg border border-gray-100 p-4 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{campaign.name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{campaign.campaign_type || campaign.type || '--'}</p>
                          </div>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${campaign.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : campaign.status === 'completed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                            {campaign.status ? t(`common.${campaign.status}`) : '--'}
                          </span>
                        </div>
                        {(campaign.progress != null) && (
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                              <span>{t('dashboard.progress')}</span>
                              <span>{campaign.progress}%</span>
                            </div>
                            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                              <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${campaign.progress}%` }} />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Rocket className="h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('clientDetail.noCampaignsYet')}</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('clientDetail.noCampaignsYetDesc')}</p>
                </div>
              )
            )}
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'Reports' && (
          <div>
            {tabLoading && (
              <div className="flex items-center justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
              </div>
            )}
            {tabError && (
              <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-600 dark:bg-red-900/20 dark:text-red-400">{tabError}</div>
            )}
            {!tabLoading && !tabError && reportsData && (
              reportsData.length > 0 ? (
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                  <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{t('clientDetail.reportsTitle')}</h2>
                  <div className="space-y-4">
                    {reportsData.map((report: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between rounded-lg border border-gray-100 p-4 dark:border-gray-700">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{report.title || report.name || t('clientDetail.reportNumber', { num: idx + 1 })}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{report.report_type || report.type || t('clientDetail.general')} {report.created_at ? ' - ' + new Date(report.created_at).toLocaleDateString() : ''}</p>
                        </div>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${report.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                          {t(`common.${report.status || 'pending'}`)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <BarChart3 className="h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('clientDetail.noReportsYet')}</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('clientDetail.noReportsYetDesc')}</p>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  )
}
