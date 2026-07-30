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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import PageHeader from "@/components/layout/PageHeader";
import StatsCard from "@/components/layout/StatsCard";
import {
  Plus,
  Rocket,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  Sparkles,
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

const CAMPAIGN_TYPE_COLORS: Record<string, string> = {
  seo: "bg-green-100 text-green-700",
  content: "bg-purple-100 text-purple-700",
  ads: "bg-red-100 text-red-700",
  social: "bg-pink-100 text-pink-700",
  email: "bg-amber-100 text-amber-700",
};

const CAMPAIGN_STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  active: "bg-green-100 text-green-700",
  paused: "bg-yellow-100 text-yellow-700",
  completed: "bg-blue-100 text-blue-700",
};

function formatNum(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

export default function Campaigns() {
  const { t } = useTranslation();
  const [campaignsData, setCampaignsData] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // New Campaign dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newClient, setNewClient] = useState('');
  const [newType, setNewType] = useState('seo');
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [newBudget, setNewBudget] = useState('');
  const [newGoals, setNewGoals] = useState('');
  const [newChannels, setNewChannels] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const fetchCampaigns = () => {
    setLoading(true);
    setError(null);
    fetch(`${API}/campaigns/`, { headers: getHeaders() })
      .then(r => handle401(r))
      .then(d => {
        if (!d) return;
        const camps = d.campaigns || d || [];
        setCampaignsData(Array.isArray(camps) ? camps : []);
      })
      .catch((e) => { setError(e.message); setCampaignsData([]); })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCampaigns();
    // Fetch clients for the dialog
    fetch(`${API}/clients/`, { headers: getHeaders() })
      .then(r => handle401(r))
      .then(d => {
        if (!d) return;
        const clientList = d.clients || d || [];
        const list = Array.isArray(clientList) ? clientList : [];
        setClients(list);
        if (list.length > 0) setNewClient(list[0].id);
      })
      .catch(() => setClients([]));
  }, []);

  const activeCampaigns = campaignsData.filter((c) => c.status === "active").length;
  const completedCampaigns = campaignsData.filter((c) => c.status === "completed").length;
  const totalBudget = campaignsData.reduce((sum, c) => sum + (c.budget || 0), 0);
  const totalSpent = campaignsData.reduce((sum, c) => sum + (c.spent || 0), 0);

  const handleCreateCampaign = () => {
    if (!newName.trim()) return;
    setCreateLoading(true);
    setError(null);
    const params = new URLSearchParams({
      name: newName,
      campaign_type: newType,
      status: 'draft',
    });
    if (newClient) params.set('client_id', newClient);
    if (newStartDate) params.set('start_date', newStartDate);
    if (newEndDate) params.set('end_date', newEndDate);
    if (newBudget) params.set('budget', newBudget);

    const body: any = {};
    if (newGoals.trim()) body.goals = newGoals.split(',').map(g => g.trim()).filter(Boolean);
    if (newChannels.trim()) body.channels = newChannels.split(',').map(ch => ch.trim()).filter(Boolean);

    fetch(`${API}/campaigns/?${params.toString()}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body),
    })
      .then(r => handle401(r))
      .then(d => {
        if (!d) return;
        setCreateOpen(false);
        setNewName('');
        setNewType('seo');
        setNewStartDate('');
        setNewEndDate('');
        setNewBudget('');
        setNewGoals('');
        setNewChannels('');
        fetchCampaigns();
      })
      .catch((e) => setError(e.message))
      .finally(() => setCreateLoading(false));
  };

  const handleGeneratePlan = async (campaignId: string) => {
    setGeneratingId(campaignId);
    setError(null);
    try {
      const res = await fetch(`${API}/campaigns/${campaignId}/generate-plan`, {
        method: 'POST',
        headers: getHeaders(),
      });
      if (res.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Error: ${res.status}`);
      }
      const data = await res.json();
      setCampaignsData(prev => prev.map(c => (c.id === campaignId ? { ...c, ...data } : c)));
      setExpandedId(campaignId);
    } catch (e: any) {
      setError(e.message || t('campaigns.generatePlanFailed'));
    } finally {
      setGeneratingId(null);
    }
  };

  const handleDeleteCampaign = (campaignId: string) => {
    setError(null);
    fetch(`${API}/campaigns/${campaignId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    })
      .then(r => handle401(r))
      .then(() => fetchCampaigns())
      .catch((e) => setError(e.message));
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t('campaigns.title')}>
        <Button onClick={() => setCreateOpen(true)}><Plus className="w-4 h-4 mr-2" /> {t('campaigns.newCampaign')}</Button>
      </PageHeader>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
          <button className="ml-2 underline" onClick={() => setError(null)}>{t('socialMedia.dismiss')}</button>
        </div>
      )}

      {/* New Campaign Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('campaigns.newCampaign')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1 block">{t('adsManager.campaignNameLabel')}</label>
              <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder={t('adsManager.campaignNamePlaceholder')} />
            </div>
            {clients.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-1 block">{t('campaigns.clientLabel')}</label>
                <Select value={newClient} onValueChange={setNewClient}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {clients.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <label className="text-sm font-medium mb-1 block">{t('common.type')}</label>
              <Select value={newType} onValueChange={setNewType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="seo">{t('campaigns.types.seo')}</SelectItem>
                  <SelectItem value="content">{t('campaigns.types.content')}</SelectItem>
                  <SelectItem value="ads">{t('campaigns.types.ads')}</SelectItem>
                  <SelectItem value="social">{t('campaigns.types.social')}</SelectItem>
                  <SelectItem value="email">{t('campaigns.types.email')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">{t('campaigns.startDate')}</label>
                <Input type="date" value={newStartDate} onChange={e => setNewStartDate(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">{t('campaigns.endDate')}</label>
                <Input type="date" value={newEndDate} onChange={e => setNewEndDate(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{t('adsManager.budgetLabel')}</label>
              <Input type="number" value={newBudget} onChange={e => setNewBudget(e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{t('campaigns.goalsLabel')}</label>
              <Textarea value={newGoals} onChange={e => setNewGoals(e.target.value)} placeholder={t('campaigns.goalsPlaceholder')} rows={2} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{t('campaigns.channelsLabel')}</label>
              <Input value={newChannels} onChange={e => setNewChannels(e.target.value)} placeholder={t('campaigns.channelsPlaceholder')} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleCreateCampaign} disabled={createLoading || !newName.trim()}>
              {createLoading ? t('common.creating') : t('adsManager.createCampaign')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      )}

      {!loading && campaignsData.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Rocket className="h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">{t('campaigns.noCampaignsYet')}</h3>
          <p className="mt-1 text-sm text-gray-500">{t('campaigns.noCampaignsYetDesc')}</p>
        </div>
      )}

      {!loading && campaignsData.length > 0 && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatsCard title={t('campaigns.activeCampaignsStat')} value={String(activeCampaigns)} icon={<Rocket className="h-5 w-5" />} />
            <StatsCard title={t('common.completed')} value={String(completedCampaigns)} icon={<CheckCircle2 className="h-5 w-5" />} />
            <StatsCard title={t('campaigns.totalBudget')} value={`$${totalBudget.toLocaleString()}`} icon={<DollarSign className="h-5 w-5" />} />
            <StatsCard title={t('campaigns.totalSpent')} value={`$${totalSpent.toLocaleString()}`} icon={<TrendingUp className="h-5 w-5" />} />
          </div>

          <div className="space-y-4">
            {campaignsData.map((campaign: any) => {
              const typeInfo = { label: campaign.type ? (t(`campaigns.types.${campaign.type}`, campaign.type) as string) : t('campaigns.other'), color: CAMPAIGN_TYPE_COLORS[campaign.type] || "bg-gray-100 text-gray-700" };
              const statusInfo = { label: campaign.status ? (t(`common.${campaign.status}`, campaign.status) as string) : t('campaigns.unknown'), color: CAMPAIGN_STATUS_COLORS[campaign.status] || "bg-gray-100 text-gray-600" };
              const spendPercent = campaign.budget > 0 ? Math.round(((campaign.spent || 0) / campaign.budget) * 100) : 0;
              const expanded = expandedId === campaign.id;

              return (
                <Card key={campaign.id}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-semibold text-base">{campaign.name}</h3>
                          <Badge className={typeInfo.color}>{typeInfo.label}</Badge>
                          <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {campaign.startDate || campaign.start_date} &mdash; {campaign.endDate || campaign.end_date}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title={t('campaigns.generateAiPlan')}
                          disabled={generatingId === campaign.id}
                          onClick={() => handleGeneratePlan(campaign.id)}
                        >
                          <Sparkles className={`w-4 h-4 ${generatingId === campaign.id ? 'animate-pulse text-purple-500' : ''}`} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                          setNewName(campaign.name || '');
                          setNewType(campaign.type || 'seo');
                          setNewStartDate(campaign.startDate || campaign.start_date || '');
                          setNewEndDate(campaign.endDate || campaign.end_date || '');
                          setNewBudget(String(campaign.budget || ''));
                          setNewGoals(Array.isArray(campaign.goals) ? campaign.goals.join(', ') : '');
                          setNewChannels(Array.isArray(campaign.channels) ? campaign.channels.join(', ') : '');
                          setCreateOpen(true);
                        }}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700" onClick={() => handleDeleteCampaign(campaign.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setExpandedId(expanded ? null : campaign.id)}>
                          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="mt-3 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">${(campaign.spent || 0).toLocaleString()} / ${(campaign.budget || 0).toLocaleString()}</span>
                        <span className="font-medium">{spendPercent}%</span>
                      </div>
                      <Progress value={spendPercent} className="h-2" />
                    </div>

                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div className="text-center">
                        <p className="text-lg font-semibold">{formatNum(campaign.impressions || 0)}</p>
                        <p className="text-xs text-muted-foreground">{t('adsManager.impressions')}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold">{formatNum(campaign.clicks || 0)}</p>
                        <p className="text-xs text-muted-foreground">{t('adsManager.clicks')}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold">{formatNum(campaign.conversions || 0)}</p>
                        <p className="text-xs text-muted-foreground">{t('adsManager.conversions')}</p>
                      </div>
                    </div>

                    {campaign.progress != null && (
                      <div className="mt-3 flex items-center gap-2">
                        <Progress value={campaign.progress} className="h-1.5 flex-1" />
                        <span className="text-xs font-medium text-muted-foreground">{campaign.progress}%</span>
                      </div>
                    )}

                    {expanded && (campaign.brief || campaign.audience_segments || campaign.budget_allocation) && (
                      <div className="mt-6 border-t pt-6 space-y-5">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-purple-500" />
                          <h4 className="text-sm font-semibold">{t('campaigns.aiCampaignPlan')}</h4>
                          {campaign.ai_model_used && (
                            <span className="text-xs text-muted-foreground">({campaign.ai_model_used})</span>
                          )}
                        </div>

                        {campaign.brief && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">{t('campaigns.creativeBrief')}</p>
                            <p className="text-sm">{campaign.brief}</p>
                          </div>
                        )}

                        {Array.isArray(campaign.audience_segments) && campaign.audience_segments.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-2">{t('campaigns.audienceSegments')}</p>
                            <div className="grid sm:grid-cols-2 gap-3">
                              {campaign.audience_segments.map((seg: any, idx: number) => (
                                <div key={idx} className="rounded-lg border p-3">
                                  <p className="text-sm font-medium">{seg.name}</p>
                                  {seg.description && <p className="text-xs text-muted-foreground mt-0.5">{seg.description}</p>}
                                  {seg.demographics && <p className="text-xs text-muted-foreground mt-1">{t('campaigns.demographics', { value: seg.demographics })}</p>}
                                  {seg.pain_points && <p className="text-xs text-muted-foreground mt-1">{t('campaigns.painPoints', { value: seg.pain_points })}</p>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {campaign.budget_allocation && Object.keys(campaign.budget_allocation).length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-2">{t('campaigns.recommendedBudgetAllocation')}</p>
                            <div className="space-y-2">
                              {Object.entries(campaign.budget_allocation).map(([channel, pct]: [string, any]) => (
                                <div key={channel} className="flex items-center gap-3">
                                  <span className="text-xs w-20 shrink-0 capitalize">{channel}</span>
                                  <Progress value={Number(pct)} className="h-2 flex-1" />
                                  <span className="text-xs w-10 text-right font-medium">{pct}%</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {expanded && campaign.milestones && campaign.milestones.length > 0 && (
                      <div className="mt-6 border-t pt-6">
                        <h4 className="text-sm font-semibold mb-3">{t('campaigns.milestones')}</h4>
                        <div className="space-y-3">
                          {campaign.milestones.map((ms: any, idx: number) => (
                            <div key={idx} className="flex items-start gap-3">
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${ms.done ? "border-green-500 bg-green-500" : "border-gray-300 bg-white"}`}>
                                {ms.done && <CheckCircle2 className="w-3 h-3 text-white" />}
                              </div>
                              <div>
                                <p className={`text-sm ${ms.done ? "line-through text-muted-foreground" : "font-medium"}`}>{ms.label}</p>
                                <p className="text-xs text-muted-foreground">{ms.date}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
