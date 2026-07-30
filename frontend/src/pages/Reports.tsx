import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  FileBarChart,
  Download,
  Eye,
  Trash2,
  Plus,
  Calendar,
  TrendingUp,
  Search,
  Loader2,
  Clock,
  Mail,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
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
import PageHeader from "@/components/layout/PageHeader";

const API = '/api/v1';
const getHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json',
});

type ReportType = "SEO" | "Ads" | "Content" | "Competitor" | "Comprehensive";
type ReportStatus = "generating" | "ready" | "sent";

interface Report {
  id: string;
  title: string;
  type: ReportType;
  client: string;
  dateRange: string;
  generatedDate: string;
  status: ReportStatus;
  data?: any;
}

const TYPE_STYLES: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
  SEO: { color: "text-blue-700", bg: "bg-blue-100 text-blue-700 border-blue-200", icon: <Search className="h-5 w-5 text-blue-600" /> },
  Ads: { color: "text-green-700", bg: "bg-green-100 text-green-700 border-green-200", icon: <TrendingUp className="h-5 w-5 text-green-600" /> },
  Content: { color: "text-purple-700", bg: "bg-purple-100 text-purple-700 border-purple-200", icon: <FileBarChart className="h-5 w-5 text-purple-600" /> },
  Competitor: { color: "text-orange-700", bg: "bg-orange-100 text-orange-700 border-orange-200", icon: <Eye className="h-5 w-5 text-orange-600" /> },
  Comprehensive: { color: "text-indigo-700", bg: "bg-gradient-to-r from-blue-100 to-purple-100 text-indigo-700 border-indigo-200", icon: <FileBarChart className="h-5 w-5 text-indigo-600" /> },
};

const STATUS_STYLES: Record<string, { bg: string }> = {
  generating: { bg: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  ready: { bg: "bg-green-100 text-green-700 border-green-200" },
  sent: { bg: "bg-blue-100 text-blue-700 border-blue-200" },
};

const Reports: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("all");
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);

  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');

  // Generate Report dialog state
  const [generateOpen, setGenerateOpen] = useState(false);
  const [genClientId, setGenClientId] = useState<string>('');
  const [genReportType, setGenReportType] = useState<string>('seo');
  const [genDateStart, setGenDateStart] = useState('');
  const [genDateEnd, setGenDateEnd] = useState('');
  const [generating, setGenerating] = useState(false);

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
        if (list.length > 0) {
          setSelectedClient(list[0].id);
          setGenClientId(list[0].id);
        }
      })
      .catch(() => setClients([]));
  }, []);

  const fetchReports = () => {
    if (!selectedClient) return;
    setLoading(true);
    setError("");
    apiFetch(`${API}/reports/${selectedClient}/reports`)
      .then(d => {
        if (!d) return;
        const reps = d.reports || d || [];
        setReports(Array.isArray(reps) ? reps : []);
      })
      .catch((e) => { setReports([]); setError(e.message); })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReports();
  }, [selectedClient]);

  const handleGenerateReport = () => {
    const clientId = genClientId || selectedClient;
    if (!clientId) return;
    setGenerating(true);
    setError("");
    const params = new URLSearchParams({ report_type: genReportType });
    if (genDateStart) params.set('date_range_start', genDateStart);
    if (genDateEnd) params.set('date_range_end', genDateEnd);
    apiFetch(`${API}/reports/${clientId}/reports/generate?${params.toString()}`, { method: 'POST' })
      .then(() => {
        setGenerateOpen(false);
        fetchReports();
      })
      .catch((e) => setError(e.message))
      .finally(() => setGenerating(false));
  };

  const handleDelete = (reportId: string) => {
    if (!selectedClient) return;
    setError("");
    apiFetch(`${API}/reports/${selectedClient}/reports/${reportId}`, { method: 'DELETE' })
      .then(() => fetchReports())
      .catch((e) => setError(e.message));
  };

  const filteredReports = activeTab === "all"
    ? reports
    : reports.filter((r) => r.type?.toLowerCase() === activeTab);

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title={t('nav.reports')}
        actions={
          <div className="flex gap-2">
            {clients.length > 0 && (
              <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">
                {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
            <Button onClick={() => { setGenClientId(selectedClient); setGenerateOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" /> {t('reports.generateReport')}
            </Button>
          </div>
        }
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      )}

      {!loading && reports.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileBarChart className="h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">{t('clientDetail.noReportsYet')}</h3>
          <p className="mt-1 text-sm text-gray-500">{t('reports.noReportsYetDesc')}</p>
        </div>
      )}

      {!loading && reports.length > 0 && (
        <>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">{t('reports.allReports')}</TabsTrigger>
              <TabsTrigger value="seo">{t('reports.types.SEO')}</TabsTrigger>
              <TabsTrigger value="ads">{t('reports.types.Ads')}</TabsTrigger>
              <TabsTrigger value="content">{t('reports.types.Content')}</TabsTrigger>
              <TabsTrigger value="competitor">{t('reports.types.Competitor')}</TabsTrigger>
              <TabsTrigger value="comprehensive">{t('reports.types.Comprehensive')}</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredReports.map((report) => {
                  const typeStyle = TYPE_STYLES[report.type] || TYPE_STYLES.SEO;
                  const statusStyle = STATUS_STYLES[report.status] || STATUS_STYLES.ready;
                  const isExpanded = expandedReportId === report.id;

                  return (
                    <Card key={report.id} className="flex flex-col">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {typeStyle.icon}
                            <Badge variant="outline" className={typeStyle.bg}>{t(`reports.types.${report.type}`, report.type)}</Badge>
                          </div>
                          <Badge variant="outline" className={statusStyle.bg}>
                            {report.status === "generating" && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                            {t(`reports.statuses.${report.status}`, report.status)}
                          </Badge>
                        </div>
                        <CardTitle className="mt-2 text-base">{report.title}</CardTitle>
                        <CardDescription className="text-xs">{report.client}</CardDescription>
                      </CardHeader>
                      <CardContent className="flex-1 space-y-2 pb-3">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{report.dateRange}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{t('reports.generatedLabel', { date: report.generatedDate })}</span>
                        </div>
                        {isExpanded && report.data && (
                          <div className="mt-3 rounded-lg border bg-gray-50 p-3 text-xs text-gray-700 overflow-auto max-h-60">
                            <pre className="whitespace-pre-wrap">{JSON.stringify(report.data, null, 2)}</pre>
                          </div>
                        )}
                      </CardContent>
                      <CardFooter className="border-t pt-3">
                        <div className="flex w-full gap-1">
                          <Button
                            variant="ghost" size="sm" className="flex-1"
                            disabled={report.status === "generating"}
                            onClick={() => setExpandedReportId(isExpanded ? null : report.id)}
                          >
                            <Eye className="mr-1 h-3.5 w-3.5" /> {t('common.view')}
                          </Button>
                          <Button
                            variant="ghost" size="sm" className="flex-1"
                            disabled={report.status === "generating"}
                            onClick={() => alert(t('reports.pdfComingSoon'))}
                          >
                            <Download className="mr-1 h-3.5 w-3.5" /> {t('reports.pdf')}
                          </Button>
                          <Button variant="ghost" size="sm" className="flex-1" disabled={report.status === "generating"}>
                            <Mail className="mr-1 h-3.5 w-3.5" /> {t('reports.send')}
                          </Button>
                          <Button
                            variant="ghost" size="sm" className="text-red-500 hover:text-red-700"
                            onClick={() => handleDelete(report.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Generate Report Dialog */}
      <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('reports.generateReport')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">{t('campaigns.clientLabel')}</label>
              <Select value={genClientId} onValueChange={setGenClientId}>
                <SelectTrigger><SelectValue placeholder={t('reports.selectClient')} /></SelectTrigger>
                <SelectContent>
                  {clients.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">{t('reports.reportTypeLabel')}</label>
              <Select value={genReportType} onValueChange={setGenReportType}>
                <SelectTrigger><SelectValue placeholder={t('reports.selectType')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="seo">{t('reports.types.SEO')}</SelectItem>
                  <SelectItem value="ads">{t('reports.types.Ads')}</SelectItem>
                  <SelectItem value="content">{t('reports.types.Content')}</SelectItem>
                  <SelectItem value="competitor">{t('reports.types.Competitor')}</SelectItem>
                  <SelectItem value="comprehensive">{t('reports.types.Comprehensive')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">{t('campaigns.startDate')}</label>
                <Input type="date" value={genDateStart} onChange={e => setGenDateStart(e.target.value)} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">{t('campaigns.endDate')}</label>
                <Input type="date" value={genDateEnd} onChange={e => setGenDateEnd(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGenerateOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleGenerateReport} disabled={generating || !genClientId}>
              {generating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('reports.generate')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Reports;
