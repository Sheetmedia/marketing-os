import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Bot,
  User,
  Send,
  Plus,
  Sparkles,
  Search,
  BarChart3,
  Target,
  Lightbulb,
  TrendingUp,
  Megaphone,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import ReactMarkdown from "react-markdown";

// ---------- Types ----------
interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const API = '/api/v1';
const getHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json',
});

// ---------- Component ----------
const AIAssistant: React.FC = () => {
  const { t } = useTranslation();

  const quickSuggestions = [
    { label: t('aiAssistant.suggestions.analyzeSeo'), icon: <Search className="h-4 w-4" /> },
    { label: t('aiAssistant.suggestions.generateContentIdeas'), icon: <Lightbulb className="h-4 w-4" /> },
    { label: t('aiAssistant.suggestions.compareCompetitors'), icon: <BarChart3 className="h-4 w-4" /> },
    { label: t('aiAssistant.suggestions.planCampaign'), icon: <Megaphone className="h-4 w-4" /> },
    { label: t('aiAssistant.suggestions.keywordOpportunities'), icon: <TrendingUp className="h-4 w-4" /> },
    { label: t('aiAssistant.suggestions.improveAdPerformance'), icon: <Target className="h-4 w-4" /> },
  ];

  const makeWelcomeMessage = (): ChatMessage => ({
    id: "welcome",
    role: "assistant",
    content: t('aiAssistant.welcomeMessage'),
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  });

  const [messages, setMessages] = useState<ChatMessage[]>([makeWelcomeMessage()]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Client selector
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>("all");

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
      })
      .catch(() => setClients([]));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim() || isTyping) return;

    const userMessage: ChatMessage = {
      id: `m-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageText = input.trim();
    setInput("");
    setIsTyping(true);
    setError("");

    fetch(`${API}/ai/chat?message=${encodeURIComponent(messageText)}`, {
      method: 'POST',
      headers: getHeaders(),
    })
      .then(r => {
        if (r.status === 401) { localStorage.removeItem('token'); window.location.href = '/login'; return null; }
        if (!r.ok) throw new Error(`Error: ${r.status}`);
        return r.json();
      })
      .then(data => {
        if (!data) return;
        const aiMessage: ChatMessage = {
          id: `m-${Date.now() + 1}`,
          role: "assistant",
          content: data.response || t('aiAssistant.emptyResponse'),
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, aiMessage]);
      })
      .catch((e) => {
        setError(e.message || t('aiAssistant.failedToGetResponse'));
        const errorMessage: ChatMessage = {
          id: `m-${Date.now() + 1}`,
          role: "assistant",
          content: t('aiAssistant.errorProcessing'),
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, errorMessage]);
      })
      .finally(() => setIsTyping(false));
  };

  const handleNewChat = () => {
    setMessages([makeWelcomeMessage()]);
    setInput("");
    setError("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (label: string) => {
    setInput(label);
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Left sidebar */}
      <div className="hidden w-64 shrink-0 flex-col border-r bg-gray-50/50 md:flex">
        <div className="p-3">
          <Button className="w-full justify-start" variant="outline" onClick={handleNewChat}>
            <Plus className="mr-2 h-4 w-4" /> {t('aiAssistant.newChat')}
          </Button>
        </div>
        <Separator />
        <div className="flex-1 px-4 py-4">
          <p className="mb-2 px-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
            {t('aiAssistant.tips')}
          </p>
          <p className="px-2 text-xs text-gray-500">
            {t('aiAssistant.tipsDesc')}
          </p>
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex flex-1 flex-col">
        {/* Chat header */}
        <div className="flex items-center gap-3 border-b px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">{t('aiAssistant.title')}</h2>
            <p className="text-xs text-gray-500">{t('aiAssistant.subtitle')}</p>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mx-4 mt-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Messages */}
        <ScrollArea className="flex-1 px-4 py-4">
          <div className="mx-auto max-w-3xl space-y-6">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Avatar */}
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    msg.role === "assistant"
                      ? "bg-gradient-to-br from-blue-500 to-indigo-600"
                      : "bg-gray-700"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <Bot className="h-4 w-4 text-white" />
                  ) : (
                    <User className="h-4 w-4 text-white" />
                  )}
                </div>

                {/* Message bubble */}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-strong:text-gray-900 prose-p:text-gray-700 prose-li:text-gray-700 prose-td:text-gray-700 prose-th:text-gray-700 prose-th:font-semibold">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  )}
                  <p
                    className={`mt-1.5 text-[10px] ${
                      msg.role === "user" ? "text-blue-200" : "text-gray-400"
                    }`}
                  >
                    {msg.timestamp}
                  </p>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="flex items-center gap-1.5 rounded-2xl bg-gray-100 px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  <span className="text-sm text-gray-500">{t('aiAssistant.thinking')}</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Quick suggestions */}
        <div className="border-t bg-gray-50/50 px-4 py-3">
          <div className="mx-auto flex max-w-3xl flex-wrap gap-2">
            {quickSuggestions.map((s) => (
              <button
                key={s.label}
                onClick={() => handleSuggestionClick(s.label)}
                className="flex items-center gap-1.5 rounded-full border bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
              >
                {s.icon}
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input area */}
        <div className="border-t bg-white px-4 py-3">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-end gap-2">
              {/* Client context selector */}
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger className="w-36 shrink-0">
                  <SelectValue placeholder={t('aiAssistant.allClients')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('aiAssistant.allClients')}</SelectItem>
                  {clients.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Textarea */}
              <div className="relative flex-1">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t('aiAssistant.inputPlaceholder')}
                  className="min-h-[44px] max-h-32 resize-none pr-12"
                  rows={1}
                />
                <Button
                  size="sm"
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  className="absolute bottom-1.5 right-1.5 h-8 w-8 p-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="mt-1.5 text-center text-[10px] text-gray-400">
              {t('aiAssistant.disclaimer')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
