import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Brain,
  Plus,
  Trash2,
  Search,
  FileText,
  X,
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

function PageHeader({ title, subtitle, children }: { title: string; subtitle: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600">
            <Brain className="h-5 w-5 text-white" />
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

export default function KnowledgeBase() {
  const { t } = useTranslation();
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [adding, setAdding] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [searching, setSearching] = useState(false);

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

  const fetchDocuments = (clientId: string) => {
    setLoading(true);
    setError(null);
    fetch(`${API}/knowledge/${clientId}/knowledge/documents`, { headers: getHeaders() })
      .then(r => { if (handleAuthError(r)) return null; if (!r.ok) throw new Error(`Error: ${r.status}`); return r.json(); })
      .then(d => { if (d) setDocuments(d.documents || []); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!selectedClient) return;
    setSearchResults(null);
    fetchDocuments(selectedClient);
  }, [selectedClient]);

  const handleAddDocument = async () => {
    if (!newTitle.trim() || !newContent.trim() || !selectedClient) return;
    setAdding(true);
    setError(null);
    try {
      const params = new URLSearchParams({ title: newTitle.trim() });
      const res = await fetch(`${API}/knowledge/${selectedClient}/knowledge/documents?${params.toString()}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(newContent),
      });
      if (handleAuthError(res)) return;
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Error: ${res.status}`);
      }
      setShowAddDialog(false);
      setNewTitle('');
      setNewContent('');
      fetchDocuments(selectedClient);
    } catch (err: any) {
      setError(err.message || 'Failed to add document');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (documentId: string) => {
    try {
      const res = await fetch(`${API}/knowledge/${selectedClient}/knowledge/documents/${documentId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (handleAuthError(res)) return;
      if (res.ok) fetchDocuments(selectedClient);
    } catch (err: any) {
      setError(err.message || 'Failed to delete document');
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || !selectedClient) return;
    setSearching(true);
    setError(null);
    try {
      const res = await fetch(`${API}/knowledge/${selectedClient}/knowledge/search`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ query: searchQuery.trim(), top_k: 5 }),
      });
      if (handleAuthError(res)) return;
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Error: ${res.status}`);
      }
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch (err: any) {
      setError(err.message || 'Search failed');
    } finally {
      setSearching(false);
    }
  };

  if (clients.length === 0 && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 lg:p-8">
        <PageHeader title={t('nav.knowledgeBrain')} subtitle={t('knowledgeBase.subtitle')} />
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Brain className="h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('knowledgeBase.noClients')}</h3>
          <p className="mt-1 text-sm text-gray-500">{t('knowledgeBase.noClientsDesc')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 lg:p-8">
      <PageHeader title={t('nav.knowledgeBrain')} subtitle={t('knowledgeBase.subtitle')}>
        {clients.length > 0 && (
          <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">
            {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
        <button
          onClick={() => setShowAddDialog(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow hover:bg-indigo-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          {t('knowledgeBase.addDocument')}
        </button>
      </PageHeader>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">&times;</button>
        </div>
      )}

      {/* Search box */}
      <div className="mb-8 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={t('knowledgeBase.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={searching || !searchQuery.trim()}
            className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {searching ? t('knowledgeBase.searching') : t('common.search')}
          </button>
        </div>
        {searchResults !== null && (
          <div className="mt-4 space-y-3">
            {searchResults.length === 0 ? (
              <p className="text-sm text-gray-500">{t('knowledgeBase.noRelevantChunks')}</p>
            ) : (
              searchResults.map((r: any) => (
                <div key={r.chunk_id} className="rounded-lg border border-gray-100 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-900/40">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-indigo-600">{t('knowledgeBase.relevance', { score: (r.score * 100).toFixed(1) })}</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{r.content}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Add document dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white dark:bg-gray-800 shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('knowledgeBase.addDocumentDialogTitle')}</h3>
              <button onClick={() => setShowAddDialog(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block text-gray-700 dark:text-gray-300">{t('knowledgeBase.titleLabel')}</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder={t('knowledgeBase.titlePlaceholder')}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-gray-700 dark:text-gray-300">{t('knowledgeBase.contentLabel')}</label>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  rows={10}
                  placeholder={t('knowledgeBase.contentPlaceholder')}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-gray-200 dark:border-gray-700">
              <button onClick={() => setShowAddDialog(false)} className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                {t('common.cancel')}
              </button>
              <button
                onClick={handleAddDocument}
                disabled={adding || !newTitle.trim() || !newContent.trim()}
                className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {adding ? t('knowledgeBase.processing') : t('knowledgeBase.addDocument')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Documents list */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
        </div>
      )}

      {!loading && documents.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
          <FileText className="h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('knowledgeBase.noDocuments')}</h3>
          <p className="mt-1 text-sm text-gray-500">{t('knowledgeBase.noDocumentsDesc')}</p>
        </div>
      )}

      {!loading && documents.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documents.map((doc: any) => (
            <div key={doc.id} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex-shrink-0">
                    <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{doc.title}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">{t('knowledgeBase.chunksCount', { count: doc.chunk_count, date: new Date(doc.created_at).toLocaleDateString() })}</p>
                  </div>
                </div>
                <button onClick={() => handleDelete(doc.id)} className="text-gray-400 hover:text-red-600 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 line-clamp-3">{doc.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
