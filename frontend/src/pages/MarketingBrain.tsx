import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Sparkles,
  AlertTriangle,
  TrendingUp,
  Target,
  PieChart,
  History,
  RefreshCw,
} from "lucide-react";

const API = '/api/v1';
const getHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json',
});

function handleAuthError(r: Response) {
  if (r.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    return true;
  }
  return false;
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  low: 'bg-blue-100 text-blue-700 border-blue-200',
};

const PRIORITY_COLORS: Record<string, string> = {
  high: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  low: 'bg-gray-100 text-gray-700 border-gray-200',
};

function PageHeader({ title, subtitle, children }: { title: string; subtitle: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-600">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          {title}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {subtitle}
        </p>
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </div>
  );
}

export default function MarketingBrain() {
  const { t } = useTranslation();
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [strategy, setStrategy] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetch(`${API}/clients/`, { headers: getHeaders() })
      .then(r => { if (handleAuthError(r)) return null; return r.json(); })
      .then(d => {
        if (!d) return;
        const list = d.clients || d || [];
        setClients(Array.isArray(list) ? list : []);
        if (list.length > 0) setSelectedClient(list[0].id);
      })
      .catch((err) => setError(err.message));
  }, []);

  const fetchLatest = (clientId: string) => {
    setLoading(true);
    setError(null);
    fetch(`${API}/marketing-brain/${clientId}/marketing-brain/latest`, { headers: getHeaders() })
      .then(r => {
        if (handleAuthError(r)) return null;
        if (r.status === 404) return { notFound: true };
        if (!r.ok) throw new Error(`Error: ${r.status}`);
        return r.json();
      })
      .then(d => {
        if (!d) return;
        setStrategy(d.notFound ? null : d);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  const fetchHistory = (clientId: string) => {
    fetch(`${API}/marketing-brain/${clientId}/marketing-brain/strategies`, { headers: getHeaders() })
      .then(r => { if (handleAuthError(r)) return null; if (!r.ok) return null; return r.json(); })
      .then(d => { if (d) setHistory(d.strategies || []); })
      .catch(() => {});
  };

  useEffect(() => {
    if (!selectedClient) return;
    setStrategy(null);
    setShowHistory(false);
    fetchLatest(selectedClient);
    fetchHistory(selectedClient);
  }, [selectedClient]);

  const handleGenerate = async () => {
    if (!selectedClient) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`${API}/marketing-brain/${selectedClient}/marketing-brain/generate`, {
        method: 'POST',
        headers: getHeaders(),
      });
      if (handleAuthError(res)) return;
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Error: ${res.status}`);
      }
      const data = await res.json();
      setStrategy(data);
      fetchHistory(selectedClient);
    } catch (err: any) {
      setError(err.message || t('marketingBrain.generateFailed'));
    } finally {
      setGenerating(false);
    }
  };

  if (clients.length === 0 && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 lg:p-8">
        <PageHeader title={t('nav.marketingBrain')} subtitle={t('marketingBrain.subtitle')} />
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Sparkles className="h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('marketingBrain.noClients')}</h3>
          <p className="mt-1 text-sm text-gray-500">{t('marketingBrain.noClientsDesc')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 lg:p-8">
      <PageHeader title={t('nav.marketingBrain')} subtitle={t('marketingBrain.subtitle')}>
        {clients.length > 0 && (
          <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">
            {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <History className="h-4 w-4" />
          {t('marketingBrain.historyButton', { count: history.length })}
        </button>
        <button
          onClick={handleGenerate}
          disabled={generating || !selectedClient}
          className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow hover:bg-purple-700 disabled:opacity-50 transition-colors"
        >
          {generating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {generating ? t('marketingBrain.generating') : strategy ? t('marketingBrain.regenerate') : t('marketingBrain.generate')}
        </button>
      </PageHeader>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">&times;</button>
        </div>
      )}

      {showHistory && (
        <div className="mb-8 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">{t('marketingBrain.historyTitle')}</h3>
          {history.length === 0 ? (
            <p className="text-sm text-gray-500">{t('marketingBrain.noHistory')}</p>
          ) : (
            <div className="space-y-2">
              {history.map((h: any) => (
                <button
                  key={h.id}
                  onClick={() => { setStrategy(h); setShowHistory(false); }}
                  className="w-full text-left flex items-center justify-between rounded-lg border border-gray-100 dark:border-gray-700 p-3 hover:bg-gray-50 dark:hover:bg-gray-900/40 transition-colors"
                >
                  <span className="text-sm text-gray-700 dark:text-gray-300 line-clamp-1">{h.situation_summary || t('marketingBrain.defaultStrategyLabel')}</span>
                  <span className="text-xs text-gray-400 flex-shrink-0 ml-3">{new Date(h.created_at).toLocaleString()}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
        </div>
      )}

      {!loading && !strategy && (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
          <Sparkles className="h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('marketingBrain.noStrategyTitle')}</h3>
          <p className="mt-1 text-sm text-gray-500">{t('marketingBrain.noStrategyDesc')}</p>
        </div>
      )}

      {!loading && strategy && (
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-600" /> {t('marketingBrain.situationOverview')}
              </h3>
              <span className="text-xs text-gray-400">
                {strategy.created_at && new Date(strategy.created_at).toLocaleString()}
                {strategy.ai_model_used && ` · ${strategy.ai_model_used}`}
              </span>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{strategy.situation_summary}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-orange-600" /> {t('marketingBrain.issuesFound')}
              </h3>
              <div className="space-y-2">
                {(strategy.diagnosed_issues || []).map((issue: any, i: number) => (
                  <div key={i} className="rounded-lg border border-gray-100 dark:border-gray-700 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-500">{issue.category}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${SEVERITY_COLORS[issue.severity] || SEVERITY_COLORS.low}`}>
                        {issue.severity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{issue.description}</p>
                  </div>
                ))}
                {(!strategy.diagnosed_issues || strategy.diagnosed_issues.length === 0) && (
                  <p className="text-sm text-gray-500">{t('marketingBrain.noIssues')}</p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
                <Target className="h-4 w-4 text-emerald-600" /> {t('marketingBrain.opportunities')}
              </h3>
              <div className="space-y-2">
                {(strategy.opportunities || []).map((opp: any, i: number) => (
                  <div key={i} className="rounded-lg border border-gray-100 dark:border-gray-700 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{opp.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${PRIORITY_COLORS[opp.priority] || PRIORITY_COLORS.low}`}>
                        {opp.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{opp.description}</p>
                    {opp.estimated_impact && (
                      <p className="text-xs text-emerald-600 mt-1">{t('marketingBrain.estimatedImpact', { impact: opp.estimated_impact })}</p>
                    )}
                  </div>
                ))}
                {(!strategy.opportunities || strategy.opportunities.length === 0) && (
                  <p className="text-sm text-gray-500">{t('marketingBrain.noOpportunities')}</p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">{t('marketingBrain.channelRecommendations')}</h3>
              <div className="space-y-2">
                {(strategy.channel_recommendations || []).map((rec: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg border border-gray-100 dark:border-gray-700 p-3">
                    <span className="text-xs font-semibold uppercase text-purple-600 w-20 flex-shrink-0 pt-0.5">{rec.channel}</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{rec.action}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${PRIORITY_COLORS[rec.priority] || PRIORITY_COLORS.low}`}>
                      {rec.priority}
                    </span>
                  </div>
                ))}
                {(!strategy.channel_recommendations || strategy.channel_recommendations.length === 0) && (
                  <p className="text-sm text-gray-500">{t('marketingBrain.noChannelRecommendations')}</p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
                <PieChart className="h-4 w-4 text-indigo-600" /> {t('marketingBrain.budgetAllocation')}
              </h3>
              <div className="space-y-2">
                {Object.entries(strategy.budget_allocation || {}).map(([channel, pct]: [string, any]) => (
                  <div key={channel}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="capitalize text-gray-600 dark:text-gray-400">{channel}</span>
                      <span className="font-medium text-gray-900 dark:text-white">{pct}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                      <div className="h-full bg-indigo-500" style={{ width: `${Math.min(Number(pct) || 0, 100)}%` }} />
                    </div>
                  </div>
                ))}
                {(!strategy.budget_allocation || Object.keys(strategy.budget_allocation).length === 0) && (
                  <p className="text-sm text-gray-500">{t('marketingBrain.noBudgetAllocation')}</p>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">{t('marketingBrain.kpiForecast')}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(strategy.kpi_forecast || {}).map(([kpi, target]: [string, any]) => (
                <div key={kpi} className="rounded-lg bg-gray-50 dark:bg-gray-900/40 p-3">
                  <p className="text-xs text-gray-500 capitalize">{kpi.replace(/_/g, ' ')}</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">{target}</p>
                </div>
              ))}
              {(!strategy.kpi_forecast || Object.keys(strategy.kpi_forecast).length === 0) && (
                <p className="text-sm text-gray-500 col-span-full">{t('marketingBrain.noKpiForecast')}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
