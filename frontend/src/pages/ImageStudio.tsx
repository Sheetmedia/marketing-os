import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Image,
  Wand2,
  Sparkles,
  Download,
  Copy,
  Trash2,
  Grid,
  Loader2,
  ChevronLeft,
  Monitor,
  Smartphone,
  LayoutGrid,
  Play,
  RefreshCw,
  Palette,
  Type,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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

const API = '/api/v1';
const getHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json',
});

const safeFetch = async (url: string, options: RequestInit = {}) => {
  const res = await fetch(url, { ...options, headers: { ...getHeaders(), ...options.headers } });
  if (res.status === 401) { localStorage.removeItem('token'); window.location.href = '/login'; return null; }
  if (!res.ok) throw new Error(`Error: ${res.status}`);
  return res.json();
};

type ImageType = "instagram-post" | "facebook-ad" | "linkedin-banner" | "blog-thumbnail" | "website-banner" | "youtube-thumbnail";
type ImageStyle = "photorealistic" | "illustration" | "minimal" | "abstract" | "corporate" | "vibrant";

interface ImageTemplate {
  type: ImageType;
  label: string;
  dimensions: string;
  width: number;
  height: number;
  icon: React.ElementType;
}

interface GeneratedImage {
  id: string;
  type: ImageType;
  prompt: string;
  style: ImageStyle;
  dimensions: string;
  gradient: string;
  textOverlay: string;
  brandColors: string[];
  createdAt: string;
  url?: string;
}

const TEMPLATES: ImageTemplate[] = [
  { type: "instagram-post", label: "Instagram Post", dimensions: "1080x1080", width: 1080, height: 1080, icon: Smartphone },
  { type: "facebook-ad", label: "Facebook Ad", dimensions: "1200x628", width: 1200, height: 628, icon: Monitor },
  { type: "linkedin-banner", label: "LinkedIn Banner", dimensions: "1584x396", width: 1584, height: 396, icon: LayoutGrid },
  { type: "blog-thumbnail", label: "Blog Thumbnail", dimensions: "1200x630", width: 1200, height: 630, icon: Image },
  { type: "website-banner", label: "Website Banner", dimensions: "1920x600", width: 1920, height: 600, icon: Monitor },
  { type: "youtube-thumbnail", label: "YouTube Thumbnail", dimensions: "1280x720", width: 1280, height: 720, icon: Play },
];

const STYLE_OPTIONS: { value: ImageStyle; label: string }[] = [
  { value: "photorealistic", label: "Photorealistic" },
  { value: "illustration", label: "Illustration" },
  { value: "minimal", label: "Minimal" },
  { value: "abstract", label: "Abstract" },
  { value: "corporate", label: "Corporate" },
  { value: "vibrant", label: "Vibrant" },
];

const GRADIENTS = [
  "from-blue-500 via-purple-500 to-pink-500",
  "from-emerald-400 via-teal-500 to-cyan-600",
  "from-orange-400 via-rose-500 to-red-600",
  "from-indigo-500 via-violet-500 to-purple-600",
  "from-amber-400 via-yellow-500 to-lime-500",
  "from-sky-400 via-blue-500 to-indigo-600",
  "from-fuchsia-500 via-pink-500 to-rose-500",
  "from-teal-400 via-emerald-500 to-green-600",
];

function templateForType(type: ImageType): ImageTemplate {
  return TEMPLATES.find((t) => t.type === type) || TEMPLATES[0];
}

function ImagePlaceholder({ gradient, textOverlay, dimensions, className = "", aspectClass = "aspect-square" }: { gradient: string; textOverlay: string; dimensions: string; className?: string; aspectClass?: string; }) {
  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-lg flex items-center justify-center relative overflow-hidden ${aspectClass} ${className}`}>
      <div className="absolute top-4 right-4 w-16 h-16 rounded-full bg-white/10" />
      <div className="absolute bottom-6 left-6 w-24 h-24 rounded-full bg-white/5" />
      <div className="text-center z-10 px-4">
        {textOverlay && <p className="text-white font-bold text-lg drop-shadow-lg mb-1">{textOverlay}</p>}
        <p className="text-white/70 text-xs">{dimensions}</p>
      </div>
    </div>
  );
}

function TemplateCard({ template, selected, onClick }: { template: ImageTemplate; selected: boolean; onClick: () => void; }) {
  const { t } = useTranslation();
  const Icon = template.icon;
  return (
    <button onClick={onClick} className={`flex-shrink-0 w-44 rounded-xl border-2 p-4 text-left transition-all hover:shadow-md ${selected ? "border-primary bg-primary/5 shadow-md" : "border-gray-200 bg-white hover:border-gray-300"}`}>
      <Icon className={`w-6 h-6 mb-2 ${selected ? "text-primary" : "text-gray-400"}`} />
      <p className="text-sm font-semibold truncate">{t(`imageStudio.templates.${template.type}`)}</p>
      <p className="text-xs text-gray-500">{template.dimensions}</p>
    </button>
  );
}

function ImageCard({ image, onView, onDelete, onDownload }: { image: GeneratedImage; onView: (id: string) => void; onDelete: (id: string) => void; onDownload: (image: GeneratedImage) => void; }) {
  const { t } = useTranslation();
  const template = templateForType(image.type);
  const aspectClass = template.width === template.height ? "aspect-square" : template.width / template.height > 2 ? "aspect-[4/1]" : "aspect-video";
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
      <div className="cursor-pointer" onClick={() => onView(image.id)}>
        <ImagePlaceholder gradient={image.gradient || GRADIENTS[0]} textOverlay={image.textOverlay || ""} dimensions={image.dimensions} aspectClass={aspectClass} />
      </div>
      <CardContent className="pt-3 pb-3 space-y-2">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-[10px]">{t(`imageStudio.templates.${template.type}`)}</Badge>
          <span className="text-[10px] text-gray-400">{image.dimensions}</span>
        </div>
        <p className="text-xs text-gray-600 line-clamp-2">{image.prompt}</p>
        <div className="flex items-center justify-between pt-1 border-t">
          <span className="text-[10px] text-gray-400">{image.createdAt}</span>
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title={t('imageStudio.download')} onClick={() => onDownload(image)}><Download className="w-3.5 h-3.5" /></Button>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title={t('imageStudio.delete')} onClick={() => onDelete(image.id)}><Trash2 className="w-3.5 h-3.5 text-red-500" /></Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ImageStudio() {
  const { t } = useTranslation();
  const [selectedTemplate, setSelectedTemplate] = useState<ImageType>("instagram-post");
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState<ImageStyle>("photorealistic");
  const [brandColor1, setBrandColor1] = useState("#3B82F6");
  const [brandColor2, setBrandColor2] = useState("#8B5CF6");
  const [textOverlay, setTextOverlay] = useState("");
  const [generating, setGenerating] = useState(false);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');

  const selectedTpl = TEMPLATES.find((t) => t.type === selectedTemplate)!;

  useEffect(() => {
    safeFetch(`${API}/clients/`)
      .then(d => {
        if (!d) return;
        const clientList = d.clients || d || [];
        const list = Array.isArray(clientList) ? clientList : [];
        setClients(list);
        if (list.length > 0) setSelectedClient(list[0].id);
      })
      .catch((err) => { setClients([]); setError(err.message); });
  }, []);

  const fetchImages = () => {
    if (!selectedClient) return;
    setLoading(true);
    setError(null);
    safeFetch(`${API}/images/${selectedClient}/images`)
      .then(d => {
        if (!d) return;
        const imgs = d.images || d || [];
        setImages(Array.isArray(imgs) ? imgs : []);
      })
      .catch((err) => { setImages([]); setError(err.message); })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchImages();
  }, [selectedClient]);

  async function handleGenerate() {
    if (!prompt.trim() || !selectedClient) return;
    setGenerating(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        prompt: prompt.trim(),
        image_type: selectedTemplate,
        style: style,
      });
      const result = await safeFetch(`${API}/images/${selectedClient}/images/generate?${params.toString()}`, {
        method: 'POST',
        body: JSON.stringify([]),
      });
      if (result) {
        setPrompt("");
        setTextOverlay("");
        fetchImages();
      }
    } catch (err: any) {
      setError(err.message || t('imageStudio.failedToGenerate'));
    } finally {
      setGenerating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!selectedClient) return;
    setError(null);
    try {
      const result = await safeFetch(`${API}/images/${selectedClient}/images/${id}`, {
        method: 'DELETE',
      });
      if (result !== null) {
        setImages((prev) => prev.filter((img) => img.id !== id));
      }
    } catch (err: any) {
      setError(err.message || t('imageStudio.failedToDelete'));
    }
  }

  function handleDownload(image: GeneratedImage) {
    const imageUrl = image.url || `${API}/images/${selectedClient}/images/${image.id}/download`;
    alert(t('imageStudio.imageUrlAlert', { url: imageUrl }));
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader title={t('imageStudio.title')} description={t('imageStudio.subtitle')}>
        <div className="flex gap-2">
          {clients.length > 0 && (
            <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">
              {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
          <Button onClick={handleGenerate} disabled={!prompt.trim() || generating}>
            {generating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            <Wand2 className="w-4 h-4 mr-2" />{t('imageStudio.generateImage')}
          </Button>
        </div>
      </PageHeader>

      {/* Error message */}
      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-sm text-red-700 dark:text-red-400 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-2 text-red-500 hover:text-red-700"><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* Template Gallery */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">{t('imageStudio.chooseTemplate')}</h3>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
          {TEMPLATES.map((tpl) => (
            <TemplateCard key={tpl.type} template={tpl} selected={selectedTemplate === tpl.type} onClick={() => setSelectedTemplate(tpl.type)} />
          ))}
        </div>
      </div>

      {/* Image Generation Panel */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">{t(`imageStudio.templates.${selectedTpl.type}`)}</CardTitle>
              <p className="text-xs text-gray-500 mt-0.5">{selectedTpl.dimensions} px</p>
            </div>
            <Badge variant="secondary">{selectedTpl.dimensions}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">{t('imageStudio.prompt')}</label>
                <Textarea placeholder={t('imageStudio.promptPlaceholder')} rows={4} value={prompt} onChange={(e) => setPrompt(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">{t('imageStudio.style')}</label>
                <Select value={style} onValueChange={(v) => setStyle(v as ImageStyle)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STYLE_OPTIONS.map((opt) => (<SelectItem key={opt.value} value={opt.value}>{t(`imageStudio.styles.${opt.value}`)}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 flex items-center gap-1"><Type className="w-3.5 h-3.5" /> {t('imageStudio.textOverlay')}</label>
                <Input placeholder={t('imageStudio.textOverlayPlaceholder')} value={textOverlay} onChange={(e) => setTextOverlay(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 flex items-center gap-1"><Palette className="w-3.5 h-3.5" /> {t('imageStudio.brandColors')}</label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-500">{t('imageStudio.primary')}</label>
                    <input type="color" value={brandColor1} onChange={(e) => setBrandColor1(e.target.value)} className="w-8 h-8 rounded cursor-pointer border border-gray-300" />
                    <span className="text-xs text-gray-400">{brandColor1}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-500">{t('imageStudio.secondary')}</label>
                    <input type="color" value={brandColor2} onChange={(e) => setBrandColor2(e.target.value)} className="w-8 h-8 rounded cursor-pointer border border-gray-300" />
                    <span className="text-xs text-gray-400">{brandColor2}</span>
                  </div>
                </div>
              </div>
              <Button className="w-full mt-2" disabled={!prompt.trim() || generating} onClick={handleGenerate}>
                {generating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <Wand2 className="w-4 h-4 mr-2" />{t('imageStudio.generateImage')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      )}

      {/* Generated Images Gallery */}
      {!loading && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">{t('imageStudio.generatedImages', { count: images.length })}</h3>
          </div>
          {images.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Image className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">{t('imageStudio.noImagesYet')}</h3>
              <p className="mt-1 text-sm text-gray-500">{t('imageStudio.noImagesYetDesc')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {images.map((img) => (
                <ImageCard key={img.id} image={img} onView={setViewingId} onDelete={handleDelete} onDownload={handleDownload} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
