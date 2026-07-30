import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import PageHeader from '@/components/layout/PageHeader'
import StatsCard from '@/components/layout/StatsCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Key, Plus, Search, ArrowUp, ArrowDown, Minus, TrendingUp, Trash2, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const API = '/api/v1';
const getHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json',
});

const ITEMS_PER_PAGE = 20;

function DifficultyBar({ value }: { value: number }) {
  const color = value < 30 ? 'bg-green-500' : value < 60 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs text-muted-foreground w-6">{value}</span>
    </div>
  )
}

function PositionChange({ current, previous }: { current: number; previous: number }) {
  const diff = previous - current
  if (diff > 0) return <span className="flex items-center text-green-600 text-sm"><ArrowUp className="h-3 w-3" />{diff}</span>
  if (diff < 0) return <span className="flex items-center text-red-600 text-sm"><ArrowDown className="h-3 w-3" />{Math.abs(diff)}</span>
  return <span className="flex items-center text-gray-400 text-sm"><Minus className="h-3 w-3" /></span>
}

export default function Keywords() {
  const { t } = useTranslation()
  const [searchTerm, setSearchTerm] = useState('')
  const [clients, setClients] = useState<any[]>([])
  const [selectedClient, setSelectedClient] = useState<string>('')
  const [keywords, setKeywords] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newKeywordsText, setNewKeywordsText] = useState('')
  const [addingKeywords, setAddingKeywords] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

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

  const fetchKeywords = (clientId: string) => {
    setLoading(true);
    setError(null);
    fetch(`${API}/keywords/${clientId}/keywords`, { headers: getHeaders() })
      .then(r => {
        if (handleAuthError(r)) return null;
        if (!r.ok) throw new Error(`Error: ${r.status}`);
        return r.json();
      })
      .then(d => {
        if (!d) return;
        const kwList = d.keywords || d || [];
        setKeywords(Array.isArray(kwList) ? kwList : []);
      })
      .catch((err) => { setKeywords([]); setError(err.message); })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!selectedClient) return;
    setKeywords([]);
    setCurrentPage(1);
    fetchKeywords(selectedClient);
  }, [selectedClient]);

  const handleAddKeywords = () => {
    if (!selectedClient || !newKeywordsText.trim()) return;
    const keywordLines = newKeywordsText.split('\n').map(k => k.trim()).filter(k => k.length > 0);
    if (keywordLines.length === 0) return;
    setAddingKeywords(true);
    setError(null);
    fetch(`${API}/keywords/${selectedClient}/keywords`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(keywordLines),
    })
      .then(r => {
        if (handleAuthError(r)) return null;
        if (!r.ok) throw new Error(`Error: ${r.status}`);
        return r.json();
      })
      .then(d => {
        if (!d) return;
        setShowAddDialog(false);
        setNewKeywordsText('');
        fetchKeywords(selectedClient);
      })
      .catch((err) => setError(err.message))
      .finally(() => setAddingKeywords(false));
  };

  const handleDeleteKeyword = (keywordId: string) => {
    if (!selectedClient) return;
    setError(null);
    fetch(`${API}/keywords/${selectedClient}/keywords/${keywordId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    })
      .then(r => {
        if (handleAuthError(r)) return null;
        if (!r.ok) throw new Error(`Error: ${r.status}`);
        return r.json();
      })
      .then(d => {
        if (d === null) return;
        fetchKeywords(selectedClient);
      })
      .catch((err) => setError(err.message));
  };

  const handleResearch = () => {
    alert(t('common.comingSoon'));
  };

  if (clients.length === 0 && !loading) {
    return (
      <div>
        <PageHeader title={t('keywords.title')} description={t('keywords.subtitle')} />
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Key className="h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">{t('common.selectClientFirst')}</h3>
          <p className="mt-1 text-sm text-gray-500">{t('keywords.addClientDesc')}</p>
        </div>
      </div>
    );
  }

  const filtered = keywords.filter((k: any) => k.keyword?.toLowerCase().includes(searchTerm.toLowerCase()))
  const inTop10 = keywords.filter((k: any) => k.position <= 10).length
  const improved = keywords.filter((k: any) => k.position < (k.prevPosition || k.previous_position || k.position)).length
  const avgPosition = keywords.length > 0 ? (keywords.reduce((sum: number, k: any) => sum + (k.position || 0), 0) / keywords.length).toFixed(1) : '0'

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginatedFiltered = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const distributionData = [
    { range: '1-3', count: keywords.filter((k: any) => k.position >= 1 && k.position <= 3).length, color: '#22c55e' },
    { range: '4-10', count: keywords.filter((k: any) => k.position >= 4 && k.position <= 10).length, color: '#3b82f6' },
    { range: '11-20', count: keywords.filter((k: any) => k.position >= 11 && k.position <= 20).length, color: '#eab308' },
    { range: '21-50', count: keywords.filter((k: any) => k.position >= 21 && k.position <= 50).length, color: '#f97316' },
  ]

  return (
    <div>
      <PageHeader
        title={t('keywords.title')}
        description={t('keywords.subtitle')}
        actions={
          <div className="flex gap-2">
            {clients.length > 0 && (
              <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">
                {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
            <Button variant="outline" onClick={handleResearch}><Search className="h-4 w-4 mr-2" /> {t('keywords.research')}</Button>
            <Button onClick={() => setShowAddDialog(true)}><Plus className="h-4 w-4 mr-2" /> {t('keywords.addKeywords')}</Button>
          </div>
        }
      />

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">&times;</button>
        </div>
      )}

      {showAddDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{t('keywords.addKeywords')}</h3>
              <button onClick={() => setShowAddDialog(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <p className="text-sm text-gray-500 mb-3">{t('keywords.enterOnePerLine')}</p>
            <textarea
              className="w-full h-40 border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              placeholder={"best running shoes\nrunning shoes for men\naffordable sneakers"}
              value={newKeywordsText}
              onChange={e => setNewKeywordsText(e.target.value)}
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>{t('common.cancel')}</Button>
              <Button onClick={handleAddKeywords} disabled={addingKeywords}>
                {addingKeywords ? t('keywords.adding') : t('keywords.addKeywords')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      )}

      {!loading && keywords.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Key className="h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">{t('keywords.noKeywordsTracked')}</h3>
          <p className="mt-1 text-sm text-gray-500">{t('keywords.noKeywordsTrackedDesc')}</p>
        </div>
      )}

      {!loading && keywords.length > 0 && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatsCard title={t('keywords.totalKeywords')} value={keywords.length} icon={<Key className="h-5 w-5" />} />
            <StatsCard title={t('keywords.avgPosition')} value={avgPosition} />
            <StatsCard title={t('keywords.inTop10')} value={inTop10} />
            <StatsCard title={t('keywords.improved')} value={improved} icon={<TrendingUp className="h-5 w-5" />} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader><CardTitle>{t('keywords.rankingDistribution')}</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={distributionData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="count" nameKey="range" label={({ range, count }: any) => `${range}: ${count}`}>
                      {distributionData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>{t('keywords.rankingTrend')}</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
                  {t('keywords.rankingHistoryPlaceholder')}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t('keywords.trackedKeywords')}</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder={t('keywords.searchPlaceholder')} className="pl-9" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">{t('dashboard.table.keyword')}</th>
                      <th className="text-center py-3 px-2 font-medium text-muted-foreground">{t('dashboard.table.position')}</th>
                      <th className="text-center py-3 px-2 font-medium text-muted-foreground">{t('dashboard.table.change')}</th>
                      <th className="text-right py-3 px-2 font-medium text-muted-foreground">{t('dashboard.table.volume')}</th>
                      <th className="text-center py-3 px-2 font-medium text-muted-foreground">{t('keywords.difficulty')}</th>
                      <th className="text-right py-3 px-2 font-medium text-muted-foreground">{t('keywords.cpc')}</th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">{t('keywords.serpFeatures')}</th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">{t('keywords.url')}</th>
                      <th className="text-center py-3 px-2 font-medium text-muted-foreground">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedFiltered.map((kw: any) => (
                      <tr key={kw.id || kw.keyword} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-2 font-medium">{kw.keyword}</td>
                        <td className="py-3 px-2 text-center">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${kw.position <= 3 ? 'bg-green-100 text-green-700' : kw.position <= 10 ? 'bg-blue-100 text-blue-700' : kw.position <= 20 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
                            {kw.position}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center"><PositionChange current={kw.position} previous={kw.prevPosition || kw.previous_position || kw.position} /></td>
                        <td className="py-3 px-2 text-right">{(kw.volume || 0).toLocaleString()}</td>
                        <td className="py-3 px-2">{kw.difficulty != null && <DifficultyBar value={kw.difficulty} />}</td>
                        <td className="py-3 px-2 text-right">{kw.cpc != null ? `$${Number(kw.cpc).toFixed(2)}` : '-'}</td>
                        <td className="py-3 px-2">
                          <div className="flex gap-1 flex-wrap">
                            {(kw.serp || []).map((feature: string) => (
                              <Badge key={feature} variant="outline" className="text-xs whitespace-nowrap">{feature}</Badge>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-2 text-xs text-muted-foreground max-w-[150px] truncate">{kw.url}</td>
                        <td className="py-3 px-2 text-center">
                          <button
                            onClick={() => handleDeleteKeyword(kw.id)}
                            className="text-gray-400 hover:text-red-600 transition-colors"
                            title={t('common.deleteKeyword')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <span className="text-sm text-muted-foreground">
                    {t('common.showingRange', { start: (currentPage - 1) * ITEMS_PER_PAGE + 1, end: Math.min(currentPage * ITEMS_PER_PAGE, filtered.length), total: filtered.length })}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <Button
                        key={page}
                        variant={page === currentPage ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
