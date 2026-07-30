import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import PageHeader from "@/components/layout/PageHeader";
import StatsCard from "@/components/layout/StatsCard";
import {
  Plus,
  DollarSign,
  Eye,
  MousePointerClick,
  TrendingUp,
  Search,
  RefreshCw,
  Zap,
  Megaphone,
} from "lucide-react";

const API = '/api/v1';
const getHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json',
});

function handle401(r: Response) {
  if (r.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    return null;
  }
  if (!r.ok) throw new Error(`Error: ${r.status}`);
  return r.json();
}

function formatNum(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

function statusBadge(status: string, t: (key: string) => string) {
  switch (status) {
    case "active":
      return <Badge className="bg-green-100 text-green-700">{t('common.active')}</Badge>;
    case "paused":
      return <Badge className="bg-yellow-100 text-yellow-700">{t('common.paused')}</Badge>;
    case "ended":
      return <Badge className="bg-gray-100 text-gray-600">{t('adsManager.ended')}</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}

export default function AdsManager() {
  const { t } = useTranslation();
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [adAccounts, setAdAccounts] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Create Campaign dialog state
  const [createCampaignOpen, setCreateCampaignOpen] = useState(false);
  const [newCampName, setNewCampName] = useState('');
  const [newCampPlatform, setNewCampPlatform] = useState('Google');
  const [newCampBudget, setNewCampBudget] = useState('');
  const [createCampLoading, setCreateCampLoading] = useState(false);

  // View details dialog state
  const [detailCampaign, setDetailCampaign] = useState<any | null>(null);

  useEffect(() => {
    fetch(`${API}/clients/`, { headers: getHeaders() })
      .then(r => handle401(r))
      .then(d => {
        if (!d) return;
        const clientList = d.clients || d || [];
        const list = Array.isArray(clientList) ? clientList : [];
        setClients(list);
        if (list.length > 0) setSelectedClient(list[0].id);
      })
      .catch((e) => { setError(e.message); setClients([]); });
  }, []);

  const fetchData = () => {
    if (!selectedClient) return;
    setLoading(true);
    setError(null);
    Promise.all([
      fetch(`${API}/ads/${selectedClient}/accounts`, { headers: getHeaders() }).then(r => handle401(r)).catch(() => []),
      fetch(`${API}/ads/${selectedClient}/campaigns`, { headers: getHeaders() }).then(r => handle401(r)).catch(() => []),
    ]).then(([acctRes, campRes]) => {
      const accts = acctRes?.accounts || acctRes || [];
      setAdAccounts(Array.isArray(accts) ? accts : []);
      const camps = campRes?.campaigns || campRes || [];
      setCampaigns(Array.isArray(camps) ? camps : []);
    }).catch((e) => setError(e.message)).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [selectedClient]);

  const filtered = campaigns.filter((c: any) => {
    if (search && !c.name?.toLowerCase().includes(search.toLowerCase())) return false;
    if (platformFilter !== "all" && c.platform !== platformFilter) return false;
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    return true;
  });

  // Stats calculations
  const totalSpend = campaigns.reduce((sum, c) => sum + (c.spend || 0), 0);
  const totalImpressions = campaigns.reduce((sum, c) => sum + (c.impressions || 0), 0);
  const totalClicks = campaigns.reduce((sum, c) => sum + (c.clicks || 0), 0);
  const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';

  const handleCreateCampaign = () => {
    if (!selectedClient || !newCampName.trim()) return;
    setCreateCampLoading(true);
    setError(null);
    const params = new URLSearchParams({
      name: newCampName,
      platform: newCampPlatform,
      budget_total: String(parseFloat(newCampBudget) || 0),
    });
    fetch(`${API}/ads/${selectedClient}/campaigns?${params.toString()}`, {
      method: 'POST',
      headers: getHeaders(),
    })
      .then(r => handle401(r))
      .then(d => {
        if (!d) return;
        setCreateCampaignOpen(false);
        setNewCampName('');
        setNewCampPlatform('Google');
        setNewCampBudget('');
        fetchData();
      })
      .catch((e) => setError(e.message))
      .finally(() => setCreateCampLoading(false));
  };

  const handleSyncNow = (acctId: string) => {
    setSyncMessage(null);
    setError(null);
    fetch(`${API}/ads/${selectedClient}/ads/accounts/${acctId}/sync`, {
      method: 'POST',
      headers: getHeaders(),
    })
      .then(r => handle401(r))
      .then(() => {
        setSyncMessage(t('adsManager.syncSuccess'));
        setTimeout(() => setSyncMessage(null), 3000);
        fetchData();
      })
      .catch((e) => {
        setSyncMessage(t('adsManager.syncTriggered'));
        setTimeout(() => setSyncMessage(null), 3000);
      });
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t('nav.adsManager')}>
        <div className="flex gap-2">
          {clients.length > 0 && (
            <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">
              {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
          <Button onClick={() => setCreateCampaignOpen(true)}><Plus className="w-4 h-4 mr-2" /> {t('adsManager.createCampaign')}</Button>
        </div>
      </PageHeader>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
          <button className="ml-2 underline" onClick={() => setError(null)}>{t('socialMedia.dismiss')}</button>
        </div>
      )}

      {syncMessage && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {syncMessage}
        </div>
      )}

      {/* Create Campaign Dialog */}
      <Dialog open={createCampaignOpen} onOpenChange={setCreateCampaignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('adsManager.createCampaign')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1 block">{t('adsManager.campaignNameLabel')}</label>
              <Input value={newCampName} onChange={e => setNewCampName(e.target.value)} placeholder={t('adsManager.campaignNamePlaceholder')} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{t('adsManager.platform')}</label>
              <Select value={newCampPlatform} onValueChange={setNewCampPlatform}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Google">Google</SelectItem>
                  <SelectItem value="Facebook">Facebook</SelectItem>
                  <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{t('adsManager.budgetLabel')}</label>
              <Input type="number" value={newCampBudget} onChange={e => setNewCampBudget(e.target.value)} placeholder="0.00" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateCampaignOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleCreateCampaign} disabled={createCampLoading || !newCampName.trim()}>
              {createCampLoading ? t('common.creating') : t('adsManager.createCampaign')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={!!detailCampaign} onOpenChange={(open) => { if (!open) setDetailCampaign(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{detailCampaign?.name || t('adsManager.campaignDetails')}</DialogTitle>
          </DialogHeader>
          {detailCampaign && (
            <div className="space-y-3 py-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">{t('adsManager.platform')}</span><span>{detailCampaign.platform}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t('common.status')}</span><span>{detailCampaign.status}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t('adsManager.budget')}</span><span>${(detailCampaign.budget || 0).toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t('adsManager.spend')}</span><span>${(detailCampaign.spend || 0).toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t('adsManager.clicks')}</span><span>{formatNum(detailCampaign.clicks || 0)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t('adsManager.conversions')}</span><span>{(detailCampaign.conversions || 0).toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t('adsManager.roas')}</span><span>{detailCampaign.roas || 0}x</span></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailCampaign(null)}>{t('common.close')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      )}

      {!loading && campaigns.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Megaphone className="h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">{t('adsManager.noCampaigns')}</h3>
          <p className="mt-1 text-sm text-gray-500">{t('adsManager.noCampaignsDesc')}</p>
        </div>
      )}

      {!loading && campaigns.length > 0 && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatsCard title={t('adsManager.totalSpend')} value={`$${totalSpend.toLocaleString()}`} icon={<DollarSign className="h-5 w-5" />} />
            <StatsCard title={t('adsManager.impressions')} value={formatNum(totalImpressions)} icon={<Eye className="h-5 w-5" />} />
            <StatsCard title={t('adsManager.clicks')} value={formatNum(totalClicks)} icon={<MousePointerClick className="h-5 w-5" />} />
            <StatsCard title={t('clientDetail.ctr')} value={`${ctr}%`} icon={<TrendingUp className="h-5 w-5" />} />
          </div>

          <Tabs defaultValue="campaigns">
            <TabsList>
              <TabsTrigger value="campaigns">{t('clients.campaigns')}</TabsTrigger>
              <TabsTrigger value="accounts">{t('adsManager.accountsTab')}</TabsTrigger>
            </TabsList>

            <TabsContent value="campaigns" className="mt-4">
              <div className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder={t('adsManager.searchCampaignsPlaceholder')} className="pl-8 w-[220px]" value={search} onChange={(e) => setSearch(e.target.value)} />
                  </div>
                  <Select value={platformFilter} onValueChange={setPlatformFilter}>
                    <SelectTrigger className="w-[150px]"><SelectValue placeholder={t('adsManager.platform')} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('socialMedia.allPlatforms')}</SelectItem>
                      <SelectItem value="Google">Google</SelectItem>
                      <SelectItem value="Facebook">Facebook</SelectItem>
                      <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px]"><SelectValue placeholder={t('common.status')} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('clients.allStatuses')}</SelectItem>
                      <SelectItem value="active">{t('common.active')}</SelectItem>
                      <SelectItem value="paused">{t('common.paused')}</SelectItem>
                      <SelectItem value="ended">{t('adsManager.ended')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t('adsManager.tableCampaign')}</TableHead>
                            <TableHead>{t('adsManager.platform')}</TableHead>
                            <TableHead>{t('common.status')}</TableHead>
                            <TableHead className="text-right">{t('adsManager.budget')}</TableHead>
                            <TableHead className="text-right">{t('adsManager.spend')}</TableHead>
                            <TableHead className="text-right">{t('adsManager.clicks')}</TableHead>
                            <TableHead className="text-right">{t('adsManager.conversions')}</TableHead>
                            <TableHead className="text-right">{t('adsManager.roas')}</TableHead>
                            <TableHead className="text-right">{t('common.actions')}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filtered.map((c: any) => (
                            <TableRow key={c.id}>
                              <TableCell className="font-medium">{c.name}</TableCell>
                              <TableCell><Badge variant="secondary">{c.platform}</Badge></TableCell>
                              <TableCell>{statusBadge(c.status, t)}</TableCell>
                              <TableCell className="text-right">${(c.budget || 0).toLocaleString()}</TableCell>
                              <TableCell className="text-right">${(c.spend || 0).toLocaleString()}</TableCell>
                              <TableCell className="text-right">{formatNum(c.clicks || 0)}</TableCell>
                              <TableCell className="text-right">{(c.conversions || 0).toLocaleString()}</TableCell>
                              <TableCell className="text-right">{c.roas || 0}x</TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="sm" onClick={() => setDetailCampaign(c)}>
                                  <Eye className="w-4 h-4 mr-1" /> {t('adsManager.detailsButton')}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="accounts" className="mt-4">
              {adAccounts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Zap className="h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">{t('adsManager.noAdAccounts')}</h3>
                  <p className="mt-1 text-sm text-gray-500">{t('adsManager.noAdAccountsDesc')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {adAccounts.map((acct: any) => (
                    <Card key={acct.id}>
                      <CardContent className="p-5 space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-100 w-10 h-10 rounded-lg flex items-center justify-center text-blue-600">
                            <Zap className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{acct.platform}</p>
                            <p className="text-xs text-muted-foreground font-mono">{acct.accountId || acct.account_id}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${acct.connected ? "bg-green-500" : "bg-gray-300"}`} />
                          <span className="text-xs text-muted-foreground">{acct.connected ? t('clientDetail.connected') : t('adsManager.disconnectedLabel')}</span>
                        </div>
                        {acct.lastSynced && <p className="text-xs text-muted-foreground">{t('adsManager.lastSynced', { date: acct.lastSynced })}</p>}
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1" onClick={() => handleSyncNow(acct.id)}>
                            <RefreshCw className="w-3.5 h-3.5 mr-1" /> {t('adsManager.syncNow')}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
