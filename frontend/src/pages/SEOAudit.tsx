import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import PageHeader from '@/components/layout/PageHeader'
import StatsCard from '@/components/layout/StatsCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, AlertTriangle, AlertCircle, Info, CheckCircle, Smartphone, Globe, Zap } from 'lucide-react'

const API = '/api/v1';
const getHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json',
});

const severityConfig = {
  critical: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', badge: 'destructive' as const },
  warning: { icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-50', badge: 'secondary' as const },
  info: { icon: Info, color: 'text-blue-600', bg: 'bg-blue-50', badge: 'outline' as const },
}

const cwvStatusColor = { good: 'text-green-600 bg-green-50', needs_improvement: 'text-yellow-600 bg-yellow-50', poor: 'text-red-600 bg-red-50' }

function ScoreCircle({ score, label, size = 'lg' }: { score: number; label: string; size?: 'sm' | 'lg' }) {
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#eab308' : '#ef4444'
  const dims = size === 'lg' ? 'w-40 h-40' : 'w-24 h-24'
  const textSize = size === 'lg' ? 'text-4xl' : 'text-xl'
  const deg = (score / 100) * 360

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`${dims} rounded-full flex items-center justify-center relative`}
        style={{ background: `conic-gradient(${color} ${deg}deg, #e5e7eb ${deg}deg)` }}
      >
        <div className={`${size === 'lg' ? 'w-32 h-32' : 'w-18 h-18'} rounded-full bg-white flex items-center justify-center`} style={{ width: size === 'lg' ? '8rem' : '4.5rem', height: size === 'lg' ? '8rem' : '4.5rem' }}>
          <span className={`${textSize} font-bold`}>{score}</span>
        </div>
      </div>
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
    </div>
  )
}

export default function SEOAudit() {
  const { t } = useTranslation()
  const [url, setUrl] = useState('')
  const [severityFilter, setSeverityFilter] = useState<string | null>(null)
  const [clients, setClients] = useState<any[]>([])
  const [selectedClient, setSelectedClient] = useState<string>('')
  const [auditData, setAuditData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  const fetchAudits = (clientId: string) => {
    setLoading(true);
    setError(null);
    fetch(`${API}/seo/${clientId}/audits`, { headers: getHeaders() })
      .then(r => {
        if (handleAuthError(r)) return null;
        if (!r.ok) throw new Error(`Error: ${r.status}`);
        return r.json();
      })
      .then(d => {
        if (!d) return;
        const audits = d.audits || d || [];
        if (Array.isArray(audits) && audits.length > 0) {
          setAuditData(audits[0]);
        } else if (!Array.isArray(audits) && audits) {
          setAuditData(audits);
        } else {
          setAuditData(null);
        }
      })
      .catch((err) => { setAuditData(null); setError(err.message); })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!selectedClient) return;
    setAuditData(null);
    fetchAudits(selectedClient);
  }, [selectedClient]);

  const handleRunAudit = () => {
    if (!selectedClient) return;
    setLoading(true);
    setError(null);
    fetch(`${API}/seo/${selectedClient}/audit`, {
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
        alert(t('seoAudit.auditStarted'));
        fetchAudits(selectedClient);
      })
      .catch((err) => { setError(err.message); setLoading(false); });
  };

  const handleAnalyze = () => {
    if (!selectedClient) return;
    if (!url.trim()) { setError(t('seoAudit.enterUrlError')); return; }
    setLoading(true);
    setError(null);
    fetch(`${API}/seo/${selectedClient}/audit`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ url: url.trim() }),
    })
      .then(r => {
        if (handleAuthError(r)) return null;
        if (!r.ok) throw new Error(`Error: ${r.status}`);
        return r.json();
      })
      .then(d => {
        if (!d) return;
        alert(t('seoAudit.auditStarted'));
        fetchAudits(selectedClient);
      })
      .catch((err) => { setError(err.message); setLoading(false); });
  };

  const technicalIssues = auditData?.technical_issues || [];
  const filteredIssues = severityFilter
    ? technicalIssues.filter((i: any) => i.severity === severityFilter)
    : technicalIssues;

  return (
    <div>
      <PageHeader
        title={t('seoAudit.title')}
        description={t('seoAudit.subtitle')}
        actions={
          <div className="flex gap-2">
            {clients.length > 0 && (
              <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">
                {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
            <Button onClick={handleRunAudit}><Search className="h-4 w-4 mr-2" /> {t('seoAudit.runNewAudit')}</Button>
          </div>
        }
      />

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Input placeholder={t('seoAudit.urlPlaceholder')} value={url} onChange={(e) => setUrl(e.target.value)} className="flex-1" />
            <Button onClick={handleAnalyze}>{t('seoAudit.analyze')}</Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">&times;</button>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      )}

      {!loading && !auditData && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search className="h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">{t('seoAudit.noAuditsYet')}</h3>
          <p className="mt-1 text-sm text-gray-500">{t('seoAudit.noAuditsYetDesc')}</p>
        </div>
      )}

      {!loading && auditData && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
            <Card className="lg:col-span-1 flex items-center justify-center p-6">
              <ScoreCircle score={auditData.overall_score || 0} label={t('seoAudit.overallScore')} />
            </Card>
            <div className="lg:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="flex items-center justify-center p-4">
                <ScoreCircle score={auditData.performance_score || 0} label={t('seoAudit.performance')} size="sm" />
              </Card>
              <Card className="flex items-center justify-center p-4">
                <ScoreCircle score={auditData.seo_score || 0} label={t('seoAudit.seo')} size="sm" />
              </Card>
              <Card className="flex items-center justify-center p-4">
                <ScoreCircle score={auditData.accessibility_score || 0} label={t('seoAudit.accessibility')} size="sm" />
              </Card>
              <Card className="flex items-center justify-center p-4">
                <ScoreCircle score={auditData.best_practices_score || 0} label={t('seoAudit.bestPractices')} size="sm" />
              </Card>
            </div>
          </div>

          {auditData.core_web_vitals && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5" /> {t('seoAudit.coreWebVitals')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {Object.entries(auditData.core_web_vitals).map(([key, data]: [string, any]) => (
                    <div key={key} className={`p-4 rounded-lg ${cwvStatusColor[(data.status as keyof typeof cwvStatusColor)] || 'bg-gray-50'}`}>
                      <p className="text-xs font-medium uppercase">{key}</p>
                      <p className="text-2xl font-bold mt-1">{data.value}{data.unit}</p>
                      <p className="text-xs mt-1">{t('seoAudit.threshold', { threshold: data.threshold })}</p>
                      <div className="flex items-center gap-1 mt-2">
                        {data.status === 'good' ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                        <span className="text-xs font-medium capitalize">{(data.status || '').replace('_', ' ')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {auditData.crawl_summary && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <StatsCard title={t('seoAudit.pagesCrawled')} value={auditData.crawl_summary.pages_crawled || 0} icon={<Globe className="h-5 w-5" />} />
              <StatsCard title={t('seoAudit.brokenLinks')} value={auditData.crawl_summary.broken_links || 0} icon={<AlertCircle className="h-5 w-5" />} />
              <StatsCard title={t('seoAudit.redirectChains')} value={auditData.crawl_summary.redirect_chains || 0} icon={<AlertTriangle className="h-5 w-5" />} />
              <StatsCard title={t('seoAudit.duplicateContent')} value={auditData.crawl_summary.duplicate_content || 0} icon={<Info className="h-5 w-5" />} />
            </div>
          )}

          {technicalIssues.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{t('seoAudit.technicalIssues', { count: technicalIssues.length })}</CardTitle>
                  <div className="flex gap-2">
                    <Button variant={severityFilter === null ? 'default' : 'outline'} size="sm" onClick={() => setSeverityFilter(null)}>{t('common.all')}</Button>
                    <Button variant={severityFilter === 'critical' ? 'default' : 'outline'} size="sm" onClick={() => setSeverityFilter('critical')}>{t('common.critical')}</Button>
                    <Button variant={severityFilter === 'warning' ? 'default' : 'outline'} size="sm" onClick={() => setSeverityFilter('warning')}>{t('common.warning')}</Button>
                    <Button variant={severityFilter === 'info' ? 'default' : 'outline'} size="sm" onClick={() => setSeverityFilter('info')}>{t('common.info')}</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredIssues.map((issue: any) => {
                    const config = severityConfig[issue.severity as keyof typeof severityConfig] || severityConfig.info
                    const Icon = config.icon
                    return (
                      <div key={issue.id} className={`p-4 rounded-lg border ${config.bg}`}>
                        <div className="flex items-start gap-3">
                          <Icon className={`h-5 w-5 mt-0.5 ${config.color}`} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{issue.title}</span>
                              <Badge variant={config.badge}>{t(`common.${issue.severity}`)}</Badge>
                              {issue.category && <Badge variant="outline">{issue.category}</Badge>}
                            </div>
                            {issue.recommendation && <p className="text-sm text-muted-foreground">{issue.recommendation}</p>}
                            {issue.url && <p className="text-xs text-muted-foreground mt-1">{t('seoAudit.urlLabel', { url: issue.url })}</p>}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {auditData.mobile_issues && auditData.mobile_issues.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Smartphone className="h-5 w-5" /> {t('seoAudit.mobileSeoIssues')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {auditData.mobile_issues.map((issue: any, idx: number) => {
                    const config = severityConfig[issue.severity as keyof typeof severityConfig] || severityConfig.info
                    const Icon = config.icon
                    return (
                      <div key={idx} className="flex items-center gap-3 p-3 rounded-lg border">
                        <Icon className={`h-5 w-5 ${config.color}`} />
                        <span className="text-sm">{issue.issue}</span>
                        <Badge variant={config.badge} className="ml-auto">{t(`common.${issue.severity}`)}</Badge>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
