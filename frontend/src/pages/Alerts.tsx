import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  Info,
  Check,
  X,
  Settings,
  ChevronDown,
  ChevronUp,
  Eye,
  Mail,
  MessageSquare,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import PageHeader from "@/components/layout/PageHeader";
import StatsCard from "@/components/layout/StatsCard";

const API = '/api/v1';
const getHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json',
});

type AlertSeverity = "critical" | "warning" | "info";
type AlertType = "ranking_drop" | "backlink_loss" | "traffic_drop" | "campaign_issue" | "milestone" | "new_backlink";
type AlertStatus = "unread" | "read";

interface Alert {
  id: string;
  severity: AlertSeverity;
  type: AlertType;
  title: string;
  message: string;
  client: string;
  timestamp: string;
  dateGroup: string;
  status: AlertStatus;
  details?: string;
}

const SEVERITY_CONFIG: Record<AlertSeverity, { icon: React.ReactNode; color: string; bg: string }> = {
  critical: { icon: <AlertCircle className="h-5 w-5 text-red-500" />, color: "text-red-700", bg: "bg-red-50 border-red-200" },
  warning: { icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />, color: "text-yellow-700", bg: "bg-yellow-50 border-yellow-200" },
  info: { icon: <Info className="h-5 w-5 text-blue-500" />, color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
};

const TYPE_COLORS: Record<string, string> = {
  ranking_drop: "bg-red-100 text-red-700 border-red-200",
  backlink_loss: "bg-orange-100 text-orange-700 border-orange-200",
  traffic_drop: "bg-rose-100 text-rose-700 border-rose-200",
  campaign_issue: "bg-yellow-100 text-yellow-700 border-yellow-200",
  milestone: "bg-green-100 text-green-700 border-green-200",
  new_backlink: "bg-blue-100 text-blue-700 border-blue-200",
};

const DATE_GROUPS = ["today", "yesterday", "this_week", "earlier"];

const Alerts: React.FC = () => {
  const { t } = useTranslation();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [typeFilter, setTypeFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [slackNotifications, setSlackNotifications] = useState(false);
  const [inAppNotifications, setInAppNotifications] = useState(true);

  const apiFetch = (url: string, options?: RequestInit) => {
    return fetch(url, { ...options, headers: { ...getHeaders(), ...options?.headers } })
      .then(r => {
        if (r.status === 401) { localStorage.removeItem('token'); window.location.href = '/login'; return null; }
        if (!r.ok) throw new Error(`Error: ${r.status}`);
        return r.json();
      });
  };

  useEffect(() => {
    apiFetch(`${API}/clients/`)
      .then(d => {
        if (!d) return;
        const clientList = d.clients || d || [];
        const list = Array.isArray(clientList) ? clientList : [];
        setClients(list);
        if (list.length > 0) setSelectedClient(list[0].id);
      })
      .catch(() => setClients([]));
  }, []);

  const fetchAlerts = () => {
    if (!selectedClient) return;
    setLoading(true);
    setError("");
    apiFetch(`${API}/alerts/${selectedClient}/alerts`)
      .then(d => {
        if (!d) return;
        const items = d.alerts || d || [];
        setAlerts(Array.isArray(items) ? items : []);
      })
      .catch((e) => { setAlerts([]); setError(e.message); })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAlerts();
  }, [selectedClient]);

  const filteredAlerts = alerts.filter((alert) => {
    if (typeFilter !== "all") {
      const typeMap: Record<string, string[]> = {
        ranking_drops: ["ranking_drop"],
        backlink_loss: ["backlink_loss"],
        traffic_drop: ["traffic_drop"],
        campaign_issues: ["campaign_issue"],
      };
      if (typeMap[typeFilter] && !typeMap[typeFilter].includes(alert.type)) return false;
    }
    if (severityFilter !== "all" && alert.severity !== severityFilter) return false;
    if (statusFilter !== "all" && alert.status !== statusFilter) return false;
    return true;
  });

  const groupedAlerts = DATE_GROUPS
    .map((group) => ({
      group,
      label: t(`alerts.dateGroups.${group}`, group),
      items: filteredAlerts.filter((a) => a.dateGroup === group),
    }))
    .filter((g) => g.items.length > 0);

  // If alerts don't have dateGroup, show them ungrouped
  const ungroupedAlerts = filteredAlerts.filter(a => !a.dateGroup);

  const markAllRead = () => {
    if (!selectedClient) return;
    setError("");
    apiFetch(`${API}/alerts/${selectedClient}/alerts/read-all`, { method: 'PUT' })
      .then(() => {
        setAlerts((prev) => prev.map((a) => ({ ...a, status: "read" as AlertStatus })));
      })
      .catch((e) => setError(e.message));
  };

  const markAsRead = (id: string) => {
    if (!selectedClient) return;
    setError("");
    apiFetch(`${API}/alerts/${selectedClient}/alerts/${id}/read`, { method: 'PUT' })
      .then(() => {
        setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, status: "read" as AlertStatus } : a)));
      })
      .catch((e) => setError(e.message));
  };

  const dismissAlert = (id: string) => {
    // No delete endpoint exists, so just mark as read
    markAsRead(id);
  };

  const handleSaveSettings = () => {
    setSettingsOpen(false);
    setSuccessMsg(t('alerts.settingsSaved'));
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const totalAlerts = alerts.length;
  const criticalCount = alerts.filter((a) => a.severity === "critical").length;
  const warningCount = alerts.filter((a) => a.severity === "warning").length;
  const unreadCount = alerts.filter((a) => a.status === "unread").length;

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title={t('alerts.title')}
        actions={
          <div className="flex gap-2">
            {clients.length > 0 && (
              <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">
                {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
            <Button variant="outline" onClick={markAllRead}><Check className="mr-2 h-4 w-4" /> {t('alerts.markAllRead')}</Button>
            <Button variant="outline" size="icon" onClick={() => setSettingsOpen(true)}><Settings className="h-4 w-4" /></Button>
          </div>
        }
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {successMsg}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      )}

      {!loading && alerts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Bell className="h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">{t('alerts.noAlertsYet')}</h3>
          <p className="mt-1 text-sm text-gray-500">{t('alerts.noAlertsYetDesc')}</p>
        </div>
      )}

      {!loading && alerts.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatsCard title={t('alerts.totalAlerts')} value={String(totalAlerts)} icon={<Bell className="h-5 w-5 text-blue-500" />} />
            <StatsCard title={t('common.critical')} value={String(criticalCount)} icon={<AlertCircle className="h-5 w-5 text-red-500" />} />
            <StatsCard title={t('alerts.warnings')} value={String(warningCount)} icon={<AlertTriangle className="h-5 w-5 text-yellow-500" />} />
            <StatsCard title={t('alerts.unread')} value={String(unreadCount)} icon={<Mail className="h-5 w-5 text-purple-500" />} />
          </div>

          <Card>
            <CardContent className="flex flex-wrap items-center gap-3 py-3">
              <span className="text-sm font-medium text-gray-500">{t('alerts.filters')}</span>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40"><SelectValue placeholder={t('alerts.alertType')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('alerts.allTypes')}</SelectItem>
                  <SelectItem value="ranking_drops">{t('alerts.rankingDrops')}</SelectItem>
                  <SelectItem value="backlink_loss">{t('alerts.backlinkLoss')}</SelectItem>
                  <SelectItem value="traffic_drop">{t('alerts.trafficDrop')}</SelectItem>
                  <SelectItem value="campaign_issues">{t('alerts.campaignIssues')}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-36"><SelectValue placeholder={t('alerts.severity')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('alerts.allSeverities')}</SelectItem>
                  <SelectItem value="critical">{t('common.critical')}</SelectItem>
                  <SelectItem value="warning">{t('common.warning')}</SelectItem>
                  <SelectItem value="info">{t('common.info')}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32"><SelectValue placeholder={t('common.status')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all')}</SelectItem>
                  <SelectItem value="unread">{t('alerts.unread')}</SelectItem>
                  <SelectItem value="read">{t('alerts.read')}</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {groupedAlerts.map((group) => (
              <div key={group.group}>
                <h3 className="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wider">{group.label}</h3>
                <div className="space-y-2">
                  {group.items.map((alert) => {
                    const severity = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.info;
                    const typeLabel = { label: t(`alerts.types.${alert.type}`, alert.type), color: TYPE_COLORS[alert.type] || "bg-gray-100 text-gray-700" };
                    const isExpanded = expandedAlert === alert.id;

                    return (
                      <Card key={alert.id} className={`transition-colors ${alert.status === "unread" ? "border-l-4 border-l-blue-500 bg-blue-50/30" : ""}`}>
                        <CardContent className="py-4">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 shrink-0">{severity.icon}</div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="font-semibold text-gray-900">{alert.title}</h4>
                                {alert.status === "unread" && <span className="h-2 w-2 rounded-full bg-blue-500" />}
                              </div>
                              <p className="mt-0.5 text-sm text-gray-600">{alert.message}</p>
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <Badge variant="outline" className={typeLabel.color}>{typeLabel.label}</Badge>
                                <span className="text-xs text-gray-400">&middot;</span>
                                <span className="text-xs font-medium text-gray-500">{alert.client}</span>
                                <span className="text-xs text-gray-400">&middot;</span>
                                <span className="text-xs text-gray-400">{alert.timestamp}</span>
                              </div>
                              {isExpanded && alert.details && (
                                <div className="mt-3 rounded-lg border bg-gray-50 p-3 text-sm text-gray-600 leading-relaxed">{alert.details}</div>
                              )}
                            </div>
                            <div className="flex shrink-0 items-center gap-1">
                              <Button variant="ghost" size="sm" onClick={() => setExpandedAlert(isExpanded ? null : alert.id)} className="text-gray-400 hover:text-gray-600">
                                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                <span className="ml-1 text-xs">{t('alerts.details')}</span>
                              </Button>
                              {alert.status === "unread" && (
                                <Button variant="ghost" size="sm" onClick={() => markAsRead(alert.id)} className="text-gray-400 hover:text-blue-600"><Eye className="h-4 w-4" /></Button>
                              )}
                              <Button variant="ghost" size="sm" onClick={() => dismissAlert(alert.id)} className="text-gray-400 hover:text-red-600"><X className="h-4 w-4" /></Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Ungrouped alerts */}
            {ungroupedAlerts.length > 0 && groupedAlerts.length === 0 && (
              <div className="space-y-2">
                {ungroupedAlerts.map((alert) => {
                  const severity = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.info;
                  const typeLabel = { label: t(`alerts.types.${alert.type}`, alert.type), color: TYPE_COLORS[alert.type] || "bg-gray-100 text-gray-700" };
                  return (
                    <Card key={alert.id} className={`transition-colors ${alert.status === "unread" ? "border-l-4 border-l-blue-500 bg-blue-50/30" : ""}`}>
                      <CardContent className="py-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 shrink-0">{severity.icon}</div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold text-gray-900">{alert.title}</h4>
                            <p className="mt-0.5 text-sm text-gray-600">{alert.message}</p>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <Badge variant="outline" className={typeLabel.color}>{typeLabel.label}</Badge>
                              <span className="text-xs text-gray-400">{alert.timestamp}</span>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => dismissAlert(alert.id)} className="text-gray-400 hover:text-red-600"><X className="h-4 w-4" /></Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {filteredAlerts.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Bell className="mb-3 h-10 w-10" />
                  <p className="text-lg font-medium">{t('alerts.noAlertsFound')}</p>
                  <p className="text-sm">{t('alerts.tryAdjustingFilters')}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}

      {/* Alert Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{t('alerts.alertSettings')}</DialogTitle></DialogHeader>
          <div className="space-y-6 py-2">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900">{t('alerts.notificationChannels')}</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-gray-500" /><label className="text-sm text-gray-600">{t('alerts.emailNotifications')}</label></div>
                  <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><MessageSquare className="h-4 w-4 text-gray-500" /><label className="text-sm text-gray-600">{t('alerts.slackNotifications')}</label></div>
                  <Switch checked={slackNotifications} onCheckedChange={setSlackNotifications} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><Bell className="h-4 w-4 text-gray-500" /><label className="text-sm text-gray-600">{t('alerts.inAppNotifications')}</label></div>
                  <Switch checked={inAppNotifications} onCheckedChange={setInAppNotifications} />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSaveSettings}>{t('alerts.saveSettings')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Alerts;
