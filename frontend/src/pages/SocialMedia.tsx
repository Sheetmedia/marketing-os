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
import PageHeader from "@/components/layout/PageHeader";
import {
  Plus,
  Link2,
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  Heart,
  MessageCircle,
  Share2,
  Edit,
  Trash2,
  Clock,
  Users,
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

function getPlatformIcon(platform: string) {
  const p = platform?.toLowerCase();
  if (p === 'instagram') return <Instagram className="w-5 h-5" />;
  if (p === 'facebook') return <Facebook className="w-5 h-5" />;
  if (p === 'linkedin') return <Linkedin className="w-5 h-5" />;
  if (p === 'twitter' || p === 'x') return <Twitter className="w-5 h-5" />;
  return <Users className="w-5 h-5" />;
}

function getPlatformColor(platform: string) {
  const p = platform?.toLowerCase();
  if (p === 'instagram') return 'bg-pink-600';
  if (p === 'facebook') return 'bg-blue-600';
  if (p === 'linkedin') return 'bg-indigo-600';
  if (p === 'twitter' || p === 'x') return 'bg-black';
  return 'bg-gray-600';
}

function getStatusBadge(status: string, t: (key: string) => string) {
  switch (status) {
    case "published":
      return <Badge className="bg-green-100 text-green-700">{t('common.published')}</Badge>;
    case "scheduled":
      return <Badge className="bg-blue-100 text-blue-700">{t('common.scheduled')}</Badge>;
    case "draft":
      return <Badge className="bg-gray-100 text-gray-600">{t('common.draft')}</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}

export default function SocialMedia() {
  const { t } = useTranslation();
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create Post dialog state
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [newPostPlatform, setNewPostPlatform] = useState('Instagram');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostSchedule, setNewPostSchedule] = useState('');
  const [createPostLoading, setCreatePostLoading] = useState(false);

  // Connect Account dialog state
  const [connectAccountOpen, setConnectAccountOpen] = useState(false);
  const [newAccountPlatform, setNewAccountPlatform] = useState('Instagram');
  const [newAccountName, setNewAccountName] = useState('');
  const [connectAccountLoading, setConnectAccountLoading] = useState(false);

  useEffect(() => {
    fetch(`${API}/clients/`, { headers: getHeaders() })
      .then(r => {
        if (r.status === 401) { localStorage.removeItem('token'); window.location.href = '/login'; return null; }
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
      .catch((e) => { setError(e.message); setClients([]); });
  }, []);

  const fetchData = () => {
    if (!selectedClient) return;
    setLoading(true);
    setError(null);
    Promise.all([
      fetch(`${API}/social/${selectedClient}/accounts`, { headers: getHeaders() }).then(r => handle401(r)).catch(() => []),
      fetch(`${API}/social/${selectedClient}/posts`, { headers: getHeaders() }).then(r => handle401(r)).catch(() => []),
    ]).then(([acctRes, postsRes]) => {
      if (!acctRes && !postsRes) return;
      const accts = acctRes?.accounts || acctRes || [];
      setAccounts(Array.isArray(accts) ? accts : []);
      const psts = postsRes?.posts || postsRes || [];
      setPosts(Array.isArray(psts) ? psts : []);
    }).catch((e) => setError(e.message)).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [selectedClient]);

  const [platformFilter, setPlatformFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = posts.filter((p: any) => {
    if (platformFilter !== "all" && p.platform !== platformFilter) return false;
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    return true;
  });

  const handleCreatePost = () => {
    if (!selectedClient || !newPostContent.trim()) return;
    setCreatePostLoading(true);
    setError(null);
    const params = new URLSearchParams({
      platform: newPostPlatform,
      content: newPostContent,
      status: 'draft',
    });
    if (newPostSchedule) params.set('scheduled_date', newPostSchedule);
    fetch(`${API}/social/${selectedClient}/posts?${params.toString()}`, {
      method: 'POST',
      headers: getHeaders(),
    })
      .then(r => handle401(r))
      .then(d => {
        if (!d) return;
        setCreatePostOpen(false);
        setNewPostContent('');
        setNewPostSchedule('');
        setNewPostPlatform('Instagram');
        fetchData();
      })
      .catch((e) => setError(e.message))
      .finally(() => setCreatePostLoading(false));
  };

  const handleConnectAccount = () => {
    if (!selectedClient || !newAccountName.trim()) return;
    setConnectAccountLoading(true);
    setError(null);
    const params = new URLSearchParams({
      platform: newAccountPlatform,
      account_name: newAccountName,
      access_token: 'placeholder',
    });
    fetch(`${API}/social/${selectedClient}/accounts?${params.toString()}`, {
      method: 'POST',
      headers: getHeaders(),
    })
      .then(r => handle401(r))
      .then(d => {
        if (!d) return;
        setConnectAccountOpen(false);
        setNewAccountName('');
        setNewAccountPlatform('Instagram');
        fetchData();
      })
      .catch((e) => setError(e.message))
      .finally(() => setConnectAccountLoading(false));
  };

  const handleDeletePost = (postId: string) => {
    if (!selectedClient) return;
    setError(null);
    fetch(`${API}/social/${selectedClient}/posts/${postId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    })
      .then(r => handle401(r))
      .then(() => fetchData())
      .catch((e) => setError(e.message));
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t('socialMedia.title')}>
        <div className="flex gap-2">
          {clients.length > 0 && (
            <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">
              {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
          <Button onClick={() => setCreatePostOpen(true)}><Plus className="w-4 h-4 mr-2" /> {t('socialMedia.createPost')}</Button>
          <Button variant="outline" onClick={() => setConnectAccountOpen(true)}><Link2 className="w-4 h-4 mr-2" /> {t('socialMedia.connectAccount')}</Button>
        </div>
      </PageHeader>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
          <button className="ml-2 underline" onClick={() => setError(null)}>{t('socialMedia.dismiss')}</button>
        </div>
      )}

      {/* Create Post Dialog */}
      <Dialog open={createPostOpen} onOpenChange={setCreatePostOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('socialMedia.createPost')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1 block">{t('socialMedia.platform')}</label>
              <Select value={newPostPlatform} onValueChange={setNewPostPlatform}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Instagram">Instagram</SelectItem>
                  <SelectItem value="Facebook">Facebook</SelectItem>
                  <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                  <SelectItem value="Twitter">Twitter</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{t('socialMedia.content')}</label>
              <Textarea value={newPostContent} onChange={e => setNewPostContent(e.target.value)} placeholder={t('socialMedia.contentPlaceholder')} rows={4} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{t('socialMedia.scheduleDate')}</label>
              <Input type="datetime-local" value={newPostSchedule} onChange={e => setNewPostSchedule(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreatePostOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleCreatePost} disabled={createPostLoading || !newPostContent.trim()}>
              {createPostLoading ? t('socialMedia.creatingPost') : t('socialMedia.createPost')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Connect Account Dialog */}
      <Dialog open={connectAccountOpen} onOpenChange={setConnectAccountOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('socialMedia.connectAccount')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1 block">{t('socialMedia.platform')}</label>
              <Select value={newAccountPlatform} onValueChange={setNewAccountPlatform}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Instagram">Instagram</SelectItem>
                  <SelectItem value="Facebook">Facebook</SelectItem>
                  <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                  <SelectItem value="Twitter">Twitter</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{t('socialMedia.accountName')}</label>
              <Input value={newAccountName} onChange={e => setNewAccountName(e.target.value)} placeholder={t('socialMedia.accountNamePlaceholder')} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConnectAccountOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleConnectAccount} disabled={connectAccountLoading || !newAccountName.trim()}>
              {connectAccountLoading ? t('socialMedia.connecting') : t('socialMedia.connect')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      )}

      {!loading && (
        <>
          {/* Connected Accounts */}
          {accounts.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {accounts.map((acct: any, idx: number) => (
                <Card key={acct.id || idx} className="relative overflow-hidden">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className={`${getPlatformColor(acct.platform)} w-10 h-10 rounded-lg flex items-center justify-center text-white shrink-0`}>
                      {getPlatformIcon(acct.platform)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{acct.platform}</p>
                      <p className="text-xs text-muted-foreground truncate">{acct.handle}</p>
                      {acct.followers && <p className="text-xs text-muted-foreground">{t('socialMedia.followersCount', { count: acct.followers })}</p>}
                    </div>
                    <div className={`w-2 h-2 rounded-full shrink-0 ${acct.connected ? "bg-green-500" : "bg-gray-300"}`} />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Posts */}
          {posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Share2 className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No social posts yet</h3>
              <p className="mt-1 text-sm text-gray-500">Create your first social media post to get started.</p>
            </div>
          ) : (
            <>
              {/* Filter bar */}
              <div className="flex flex-wrap gap-3">
                <Select value={platformFilter} onValueChange={setPlatformFilter}>
                  <SelectTrigger className="w-[160px]"><SelectValue placeholder="Platform" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Platforms</SelectItem>
                    <SelectItem value="Instagram">Instagram</SelectItem>
                    <SelectItem value="Facebook">Facebook</SelectItem>
                    <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                    <SelectItem value="Twitter">Twitter</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                {filtered.map((post: any) => (
                  <Card key={post.id}>
                    <CardContent className="flex items-start gap-4 p-4">
                      <div className={`${getPlatformColor(post.platform)} w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0`}>
                        {getPlatformIcon(post.platform)}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-sm line-clamp-2">{post.content}</p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>{post.platform}</span>
                          {post.scheduledDate && (
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{post.scheduledDate}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        {getStatusBadge(post.status, t)}
                        {post.status === "published" && (
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {post.likes || 0}</span>
                            <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> {post.comments || 0}</span>
                            <span className="flex items-center gap-1"><Share2 className="w-3 h-3" /> {post.shares || 0}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                            setNewPostPlatform(post.platform || 'Instagram');
                            setNewPostContent(post.content || '');
                            setNewPostSchedule(post.scheduledDate || '');
                            setCreatePostOpen(true);
                          }}>
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700" onClick={() => handleDeletePost(post.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
