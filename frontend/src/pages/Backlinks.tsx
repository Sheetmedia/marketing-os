import React, { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Link2,
  Globe,
  Shield,
  AlertTriangle,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const API = '/api/v1';
const getHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json',
});

// ---------------------------------------------------------------------------
// Helper Components
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

function StatsCard({ title, value, icon: Icon, trend, trendDirection }: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
  trendDirection?: "up" | "down";
}) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</span>
        <Icon className="h-5 w-5 text-gray-400" />
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-gray-900 dark:text-white">{value}</span>
        {trend && (
          <span className={`inline-flex items-center text-xs font-medium ${trendDirection === "up" ? "text-green-600" : "text-red-500"}`}>
            {trend}
          </span>
        )}
      </div>
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

function getDaBadgeVariant(da: number): "success" | "secondary" | "warning" | "destructive" | "default" {
  if (da >= 80) return "success";
  if (da >= 60) return "secondary";
  if (da >= 40) return "warning";
  return "default";
}

function getPageNumbers(currentPage: number, totalPages: number): (number | '...')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages: (number | '...')[] = [1];
  if (currentPage > 3) pages.push('...');
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (currentPage < totalPages - 2) pages.push('...');
  pages.push(totalPages);
  return pages;
}

const ITEMS_PER_PAGE = 6;

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function Backlinks() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "lost" | "broken">("all");
  const [relFilter, setRelFilter] = useState<"all" | "follow" | "nofollow">("all");
  const [minDa, setMinDa] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [backlinksData, setBacklinksData] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuthError = (r: Response) => {
    if (r.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      return true;
    }
    return false;
  };

  useEffect(() => {
    fetch(`${API}/clients/`, { headers: getHeaders() })
      .then(r => {
        if (handleAuthError(r)) return null;
        if (!r.ok) throw new Error(`Error: ${r.status}`);
        return r.json();
      })
      .then(d => {
        if (!d) return;
        const clientList = d.clients || d || [];
        const list = Array.isArray(clientList) ? clientList : [];
        setClients(list);
        if (list.length > 0) setSelectedClient(list[0].id);
      })
      .catch((err) => { setClients([]); setError(err.message); });
  }, []);

  const fetchBacklinks = (clientId: string) => {
    setLoading(true);
    setError(null);
    Promise.all([
      fetch(`${API}/backlinks/${clientId}/backlinks`, { headers: getHeaders() })
        .then(r => {
          if (handleAuthError(r)) return null;
          if (!r.ok) throw new Error(`Error: ${r.status}`);
          return r.json();
        })
        .catch(() => []),
      fetch(`${API}/backlinks/${clientId}/backlinks/profile`, { headers: getHeaders() })
        .then(r => {
          if (handleAuthError(r)) return null;
          if (!r.ok) throw new Error(`Error: ${r.status}`);
          return r.json();
        })
        .catch(() => null),
    ]).then(([blRes, profileRes]) => {
      if (blRes) {
        const bls = blRes.backlinks || blRes || [];
        setBacklinksData(Array.isArray(bls) ? bls : []);
      } else {
        setBacklinksData([]);
      }
      setProfile(profileRes);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!selectedClient) return;
    setBacklinksData([]);
    setProfile(null);
    setCurrentPage(1);
    fetchBacklinks(selectedClient);
  }, [selectedClient]);

  const handleAnalyzeDomain = () => {
    if (!selectedClient) return;
    setLoading(true);
    setError(null);
    fetch(`${API}/backlinks/${selectedClient}/backlinks/analyze`, {
      method: 'POST',
      headers: getHeaders(),
    })
      .then(r => {
        if (handleAuthError(r)) return null;
        if (!r.ok) throw new Error(`Error: ${r.status}`);
        return r.json();
      })
      .then(d => {
        if (!d) return;
        alert(t('backlinks.analysisStarted'));
        fetchBacklinks(selectedClient);
      })
      .catch((err) => { setError(err.message); setLoading(false); });
  };

  const filteredBacklinks = useMemo(() => {
    return backlinksData.filter((bl: any) => {
      if (statusFilter !== "all" && bl.status !== statusFilter) return false;
      if (relFilter !== "all" && bl.relType !== relFilter) return false;
      if ((bl.domainAuthority || bl.domain_authority || 0) < minDa) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          (bl.sourceUrl || bl.source_url || "").toLowerCase().includes(q) ||
          (bl.targetUrl || bl.target_url || "").toLowerCase().includes(q) ||
          (bl.anchorText || bl.anchor_text || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [searchQuery, statusFilter, relFilter, minDa, backlinksData]);

  const totalPages = Math.max(1, Math.ceil(filteredBacklinks.length / ITEMS_PER_PAGE));
  const paginatedBacklinks = filteredBacklinks.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, relFilter, minDa]);

  const showingStart = filteredBacklinks.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const showingEnd = Math.min(currentPage * ITEMS_PER_PAGE, filteredBacklinks.length);

  if (clients.length === 0 && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 lg:p-8">
        <PageHeader title={t('backlinks.title')} />
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Link2 className="h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('common.selectClientFirst')}</h3>
          <p className="mt-1 text-sm text-gray-500">{t('backlinks.selectClientDesc')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 lg:p-8">
      {/* Header */}
      <PageHeader title={t('backlinks.title')}>
        {clients.length > 0 && (
          <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">
            {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
        <button
          onClick={handleAnalyzeDomain}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow hover:bg-indigo-700 transition-colors"
        >
          <Search className="h-4 w-4" />
          {t('backlinks.analyzeDomain')}
        </button>
      </PageHeader>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">&times;</button>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      )}

      {!loading && backlinksData.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Link2 className="h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('backlinks.noBacklinksFound')}</h3>
          <p className="mt-1 text-sm text-gray-500">{t('backlinks.noBacklinksFoundDesc')}</p>
        </div>
      )}

      {!loading && backlinksData.length > 0 && (
        <>
          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatsCard title={t('backlinks.totalBacklinks')} value={profile?.total_backlinks || backlinksData.length} icon={Link2} />
            <StatsCard title={t('backlinks.referringDomains')} value={profile?.referring_domains || 0} icon={Globe} />
            <StatsCard title={t('backlinks.avgDomainAuthority')} value={profile?.domain_authority || 0} icon={Shield} />
            <StatsCard title={t('backlinks.spamScore')} value={`${profile?.spam_score || 0}%`} icon={AlertTriangle} />
          </div>

          {/* Backlinks Table */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm mb-8">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Link2 className="h-5 w-5" />
                  {t('backlinks.backlinksCount', { count: filteredBacklinks.length })}
                </h2>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder={t('backlinks.searchPlaceholder')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none w-64"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="all">{t('backlinks.allStatus')}</option>
                    <option value="active">{t('common.active')}</option>
                    <option value="lost">{t('common.lost')}</option>
                    <option value="broken">{t('common.broken')}</option>
                  </select>
                  <select
                    value={relFilter}
                    onChange={(e) => setRelFilter(e.target.value as any)}
                    className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="all">{t('backlinks.allRelTypes')}</option>
                    <option value="follow">{t('common.follow')}</option>
                    <option value="nofollow">{t('common.nofollow')}</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">{t('backlinks.sourceUrl')}</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">{t('backlinks.targetUrl')}</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">{t('backlinks.anchorText')}</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-500 dark:text-gray-400">{t('clientDetail.domainAuthorityAbbr')}</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-500 dark:text-gray-400">{t('common.status')}</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-500 dark:text-gray-400">{t('backlinks.rel')}</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedBacklinks.map((bl: any, idx: number) => {
                    const da = bl.domainAuthority || bl.domain_authority || 0;
                    const sourceUrl = bl.sourceUrl || bl.source_url || "";
                    const targetUrl = bl.targetUrl || bl.target_url || "";
                    return (
                      <tr key={bl.id || idx} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                        <td className="px-4 py-3">
                          <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline max-w-[200px] truncate block">
                            {sourceUrl.replace("https://", "")}
                          </a>
                        </td>
                        <td className="px-4 py-3 max-w-[120px] truncate">
                          <a href={targetUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {targetUrl}
                          </a>
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300 max-w-[150px] truncate">{bl.anchorText || bl.anchor_text}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={getDaBadgeVariant(da)}>{da}</Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={bl.status === "active" ? "success" : bl.status === "lost" ? "destructive" : "warning"}>
                            {t(`common.${bl.status}`)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={(bl.relType || bl.rel_type) === "follow" ? "secondary" : "outline"}>
                            {t(`common.${bl.relType || bl.rel_type}`)}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                  {paginatedBacklinks.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                        {t('backlinks.noBacklinksMatchFilters')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {t('common.showingRange', { start: showingStart, end: showingEnd, total: filteredBacklinks.length })}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {getPageNumbers(currentPage, totalPages).map((page, idx) => (
                  page === '...' ? (
                    <span key={`ellipsis-${idx}`} className="px-2 py-1.5 text-sm text-gray-400">...</span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                        page === currentPage
                          ? "bg-indigo-600 text-white"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                    >
                      {page}
                    </button>
                  )
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
