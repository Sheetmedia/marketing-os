import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Users,
  Plus,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Target,
  FileText,
  Link2,
  Eye,
  Sparkles,
  ExternalLink,
  Mail,
  Trash2,
  X,
  Loader2,
} from "lucide-react";

const API = '/api/v1';
const getHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json',
});

const safeFetch = async (url: string, options: RequestInit = {}) => {
  const res = await fetch(url, { ...options, headers: { ...getHeaders(), ...options.headers } });
  if (res.status === 401) { localStorage.removeItem('token'); window.location.href = '/login'; return null; }
  if (!res.ok) throw new Error(`Error: ${res.status}`);
  return res.json();
};

// ---------------------------------------------------------------------------
// Shared Helper Components
// ---------------------------------------------------------------------------

function PageHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">{title}</h1>
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </div>
  );
}

function Badge({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "success" | "destructive" | "warning" | "secondary" | "outline" }) {
  const colors: Record<string, string> = {
    default: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
    success: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    destructive: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    secondary: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    outline: "border border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[variant]}`}>
      {children}
    </span>
  );
}

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K`;
  return n.toLocaleString();
}

function ComparisonIndicator({ value, compare }: { value: number; compare: number }) {
  const { t } = useTranslation();
  if (value > compare) {
    return (
      <span className="inline-flex items-center text-xs text-green-600 dark:text-green-400">
        <ArrowUpRight className="h-3 w-3" />
        {t('competitors.higher')}
      </span>
    );
  }
  if (value < compare) {
    return (
      <span className="inline-flex items-center text-xs text-red-500 dark:text-red-400">
        <ArrowDownRight className="h-3 w-3" />
        {t('competitors.lower')}
      </span>
    );
  }
  return <span className="text-xs text-gray-400">{t('competitors.equal')}</span>;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function Competitors() {
  const { t } = useTranslation();
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [competitors, setCompetitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add competitor dialog state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [newName, setNewName] = useState('');
  const [addingCompetitor, setAddingCompetitor] = useState(false);

  // Analysis dialog state
  const [selectedCompetitor, setSelectedCompetitor] = useState<any | null>(null);
  const [analysisOpen, setAnalysisOpen] = useState(false);

  useEffect(() => {
    safeFetch(`${API}/clients/`)
      .then(d => {
        if (!d) return;
        const clientList = d.clients || d || [];
        const list = Array.isArray(clientList) ? clientList : [];
        setClients(list);
        if (list.length > 0) setSelectedClient(list[0].id);
      })
      .catch((err) => { setClients([]); setError(err.message); });
  }, []);

  const fetchCompetitors = () => {
    if (!selectedClient) return;
    setLoading(true);
    setError(null);
    safeFetch(`${API}/competitors/${selectedClient}/competitors`)
      .then(d => {
        if (!d) return;
        const comps = d.competitors || d || [];
        setCompetitors(Array.isArray(comps) ? comps : []);
      })
      .catch((err) => { setCompetitors([]); setError(err.message); })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCompetitors();
  }, [selectedClient]);

  const handleAddCompetitor = async () => {
    if (!newDomain.trim() || !newName.trim() || !selectedClient) return;
    setAddingCompetitor(true);
    setError(null);
    try {
      const params = new URLSearchParams({ domain: newDomain.trim(), name: newName.trim() });
      const result = await safeFetch(`${API}/competitors/${selectedClient}/competitors?${params.toString()}`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      if (result) {
        setAddDialogOpen(false);
        setNewDomain('');
        setNewName('');
        fetchCompetitors();
      }
    } catch (err: any) {
      setError(err.message || t('competitors.failedToAdd'));
    } finally {
      setAddingCompetitor(false);
    }
  };

  const handleDeleteCompetitor = async (competitorId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setError(null);
    try {
      const result = await safeFetch(`${API}/competitors/${selectedClient}/competitors/${competitorId}`, {
        method: 'DELETE',
      });
      if (result !== null) {
        fetchCompetitors();
      }
    } catch (err: any) {
      setError(err.message || t('competitors.failedToDelete'));
    }
  };

  const handleCardClick = (comp: any) => {
    setSelectedCompetitor(comp);
    setAnalysisOpen(true);
  };

  if (clients.length === 0 && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 lg:p-8">
        <PageHeader title={t('competitors.title')} />
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('common.selectClientFirst')}</h3>
          <p className="mt-1 text-sm text-gray-500">{t('competitors.selectClientDesc')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 lg:p-8">
      {/* Header */}
      <PageHeader title={t('competitors.title')}>
        {clients.length > 0 && (
          <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)}
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white px-3 py-2 text-sm">
            {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
        <button
          onClick={() => setAddDialogOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow hover:bg-indigo-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          {t('competitors.addCompetitor')}
        </button>
      </PageHeader>

      {/* Error message */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-sm text-red-700 dark:text-red-400 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-2 text-red-500 hover:text-red-700"><X className="h-4 w-4" /></button>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      )}

      {!loading && competitors.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('competitors.noCompetitorsTracked')}</h3>
          <p className="mt-1 text-sm text-gray-500">{t('competitors.noCompetitorsTrackedDesc')}</p>
        </div>
      )}

      {!loading && competitors.length > 0 && (
        <>
          {/* Competitor Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {competitors.map((comp: any) => (
              <div
                key={comp.domain || comp.id}
                onClick={() => handleCardClick(comp)}
                className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-indigo-500" />
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{comp.domain || comp.name}</span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteCompetitor(comp.id, e)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded"
                    title={t('competitors.deleteCompetitor')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-2 text-sm">
                  {comp.da != null && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">{t('competitors.domainAuthority')}</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{comp.da}</span>
                    </div>
                  )}
                  {comp.organicTraffic != null && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">{t('competitors.organicTraffic')}</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{typeof comp.organicTraffic === 'number' ? formatNumber(comp.organicTraffic) : comp.organicTraffic}</span>
                    </div>
                  )}
                  {comp.totalKeywords != null && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">{t('competitors.totalKeywords')}</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{typeof comp.totalKeywords === 'number' ? formatNumber(comp.totalKeywords) : comp.totalKeywords}</span>
                    </div>
                  )}
                  {comp.totalBacklinks != null && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">{t('competitors.totalBacklinks')}</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{typeof comp.totalBacklinks === 'number' ? formatNumber(comp.totalBacklinks) : comp.totalBacklinks}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Add Competitor Dialog */}
      {addDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('competitors.addCompetitor')}</h2>
              <button onClick={() => { setAddDialogOpen(false); setNewDomain(''); setNewName(''); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">{t('competitors.competitorName')}</label>
                <input
                  type="text"
                  placeholder={t('competitors.competitorNamePlaceholder')}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">{t('competitors.domain')}</label>
                <input
                  type="text"
                  placeholder={t('competitors.domainPlaceholder')}
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => { setAddDialogOpen(false); setNewDomain(''); setNewName(''); }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleAddCompetitor}
                disabled={!newDomain.trim() || !newName.trim() || addingCompetitor}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addingCompetitor && <Loader2 className="h-4 w-4 animate-spin" />}
                {t('competitors.addCompetitor')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Dialog */}
      {analysisOpen && selectedCompetitor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('competitors.analysisTitle', { name: selectedCompetitor.name || selectedCompetitor.domain })}
              </h2>
              <button onClick={() => { setAnalysisOpen(false); setSelectedCompetitor(null); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-gray-50 dark:bg-gray-700 p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('competitors.domain')}</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{selectedCompetitor.domain || t('competitors.notAvailable')}</p>
                </div>
                <div className="rounded-lg bg-gray-50 dark:bg-gray-700 p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('competitors.domainAuthority')}</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{selectedCompetitor.da ?? t('competitors.notAvailable')}</p>
                </div>
                <div className="rounded-lg bg-gray-50 dark:bg-gray-700 p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('competitors.organicTraffic')}</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {selectedCompetitor.organicTraffic != null ? (typeof selectedCompetitor.organicTraffic === 'number' ? formatNumber(selectedCompetitor.organicTraffic) : selectedCompetitor.organicTraffic) : t('competitors.notAvailable')}
                  </p>
                </div>
                <div className="rounded-lg bg-gray-50 dark:bg-gray-700 p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('competitors.totalKeywords')}</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {selectedCompetitor.totalKeywords != null ? (typeof selectedCompetitor.totalKeywords === 'number' ? formatNumber(selectedCompetitor.totalKeywords) : selectedCompetitor.totalKeywords) : t('competitors.notAvailable')}
                  </p>
                </div>
                <div className="rounded-lg bg-gray-50 dark:bg-gray-700 p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('competitors.totalBacklinks')}</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {selectedCompetitor.totalBacklinks != null ? (typeof selectedCompetitor.totalBacklinks === 'number' ? formatNumber(selectedCompetitor.totalBacklinks) : selectedCompetitor.totalBacklinks) : t('competitors.notAvailable')}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => { setAnalysisOpen(false); setSelectedCompetitor(null); }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
