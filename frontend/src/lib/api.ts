import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth
export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', null, { params: { email, password } }),
  register: (data: { email: string; password: string; full_name: string }) => api.post('/auth/register', null, { params: data }),
  getMe: () => api.get('/auth/me'),
}

// Clients
export const clientsApi = {
  list: (params?: Record<string, unknown>) => api.get('/clients', { params }),
  get: (id: string) => api.get(`/clients/${id}`),
  create: (data: Record<string, unknown>) => api.post('/clients', null, { params: data }),
  update: (id: string, data: Record<string, unknown>) => api.put(`/clients/${id}`, null, { params: data }),
  delete: (id: string) => api.delete(`/clients/${id}`),
  getDashboard: (id: string) => api.get(`/clients/${id}/dashboard`),
}

// SEO
export const seoApi = {
  triggerAudit: (clientId: string, url?: string) => api.post(`/seo/${clientId}/audit`, null, { params: { url } }),
  listAudits: (clientId: string) => api.get(`/seo/${clientId}/audits`),
  getAudit: (clientId: string, auditId: string) => api.get(`/seo/${clientId}/audits/${auditId}`),
  getMetrics: (clientId: string) => api.get(`/seo/${clientId}/metrics`),
  getTechnicalIssues: (clientId: string) => api.get(`/seo/${clientId}/technical-issues`),
}

// Keywords
export const keywordsApi = {
  list: (clientId: string, params?: Record<string, unknown>) => api.get(`/keywords/${clientId}/keywords`, { params }),
  add: (clientId: string, keywords: string[]) => api.post(`/keywords/${clientId}/keywords`, null, { params: { keywords } }),
  research: (clientId: string, seedKeywords: string[]) => api.post(`/keywords/${clientId}/keywords/research`, null, { params: { seed_keywords: seedKeywords } }),
  getRankings: (clientId: string) => api.get(`/keywords/${clientId}/keywords/rankings`),
}

// Backlinks
export const backlinksApi = {
  list: (clientId: string, params?: Record<string, unknown>) => api.get(`/backlinks/${clientId}/backlinks`, { params }),
  getProfile: (clientId: string) => api.get(`/backlinks/${clientId}/backlinks/profile`),
  getLost: (clientId: string) => api.get(`/backlinks/${clientId}/backlinks/lost`),
  getNew: (clientId: string) => api.get(`/backlinks/${clientId}/backlinks/new`),
}

// Content
export const contentApi = {
  list: (clientId: string, params?: Record<string, unknown>) => api.get(`/content/${clientId}/content`, { params }),
  generate: (clientId: string, data: Record<string, unknown>) => api.post(`/content/${clientId}/content/generate`, null, { params: data }),
  get: (clientId: string, contentId: string) => api.get(`/content/${clientId}/content/${contentId}`),
  optimize: (clientId: string, contentId: string, keywords: string[]) => api.post(`/content/${clientId}/content/${contentId}/optimize`, null, { params: { target_keywords: keywords } }),
}

// Images
export const imagesApi = {
  list: (clientId: string) => api.get(`/images/${clientId}/images`),
  generate: (clientId: string, data: Record<string, unknown>) => api.post(`/images/${clientId}/images/generate`, null, { params: data }),
}

// Social Media
export const socialApi = {
  getAccounts: (clientId: string) => api.get(`/social/${clientId}/accounts`),
  getPosts: (clientId: string, params?: Record<string, unknown>) => api.get(`/social/${clientId}/posts`, { params }),
  createPost: (clientId: string, data: Record<string, unknown>) => api.post(`/social/${clientId}/posts`, null, { params: data }),
  getCalendar: (clientId: string) => api.get(`/social/${clientId}/calendar`),
  getAnalytics: (clientId: string) => api.get(`/social/${clientId}/analytics`),
}

// Ads
export const adsApi = {
  getAccounts: (clientId: string) => api.get(`/ads/${clientId}/accounts`),
  getCampaigns: (clientId: string) => api.get(`/ads/${clientId}/campaigns`),
  getAnalytics: (clientId: string) => api.get(`/ads/${clientId}/analytics`),
}

// Campaigns
export const campaignsApi = {
  list: (params?: Record<string, unknown>) => api.get('/campaigns', { params }),
  get: (id: string) => api.get(`/campaigns/${id}`),
  create: (data: Record<string, unknown>) => api.post('/campaigns', null, { params: data }),
  getMetrics: (id: string) => api.get(`/campaigns/${id}/metrics`),
}

// Reports
export const reportsApi = {
  list: (clientId: string) => api.get(`/reports/${clientId}/reports`),
  generate: (clientId: string, data: Record<string, unknown>) => api.post(`/reports/${clientId}/reports/generate`, null, { params: data }),
  get: (clientId: string, reportId: string) => api.get(`/reports/${clientId}/reports/${reportId}`),
}

// AI Assistant
export const aiApi = {
  chat: (message: string, clientId?: string) => api.post('/ai/chat', null, { params: { message, client_id: clientId } }),
  analyze: (url: string) => api.post('/ai/analyze', null, { params: { url } }),
  recommend: (clientId: string) => api.post('/ai/recommend', null, { params: { client_id: clientId } }),
}

// Alerts
export const alertsApi = {
  list: (clientId: string, params?: Record<string, unknown>) => api.get(`/alerts/${clientId}/alerts`, { params }),
  markRead: (clientId: string, alertId: string) => api.put(`/alerts/${clientId}/alerts/${alertId}/read`),
  markAllRead: (clientId: string) => api.put(`/alerts/${clientId}/alerts/read-all`),
}

// Competitors
export const competitorsApi = {
  list: (clientId: string) => api.get(`/competitors/${clientId}/competitors`),
  add: (clientId: string, domain: string, name: string) => api.post(`/competitors/${clientId}/competitors`, null, { params: { domain, name } }),
  getAnalysis: (clientId: string, competitorId: string) => api.get(`/competitors/${clientId}/competitors/${competitorId}/analysis`),
  getKeywordGap: (clientId: string) => api.get(`/competitors/${clientId}/competitors/keyword-gap`),
  getContentGap: (clientId: string) => api.get(`/competitors/${clientId}/competitors/content-gap`),
  getBacklinkGap: (clientId: string) => api.get(`/competitors/${clientId}/competitors/backlink-gap`),
}

// SEO By AI - Autonomous Autopilot
export const seoByAiApi = {
  getStatus: (clientId: string) => api.get(`/seo-by-ai/${clientId}/status`),
  runCycle: (clientId: string) => api.post(`/seo-by-ai/${clientId}/run-cycle`),
  getActionPlan: (clientId: string) => api.get(`/seo-by-ai/${clientId}/action-plan`),
  approveAction: (clientId: string, actionId: string) => api.post(`/seo-by-ai/${clientId}/approve/${actionId}`),
  rejectAction: (clientId: string, actionId: string, reason?: string) => api.post(`/seo-by-ai/${clientId}/reject/${actionId}`, null, { params: { reason } }),
  getStrategy: (clientId: string) => api.get(`/seo-by-ai/${clientId}/strategy`),
  getDeepAnalysis: (clientId: string) => api.get(`/seo-by-ai/${clientId}/deep-analysis`),
  getContentRoadmap: (clientId: string) => api.get(`/seo-by-ai/${clientId}/content-roadmap`),
  getPredictions: (clientId: string) => api.get(`/seo-by-ai/${clientId}/predictions`),
  getExecutionHistory: (clientId: string, category?: string) => api.get(`/seo-by-ai/${clientId}/execution-history`, { params: { category } }),
  chatWithAtlas: (clientId: string, message: string) => api.post(`/seo-by-ai/${clientId}/chat`, null, { params: { message } }),
  updateSettings: (clientId: string, settings: Record<string, unknown>) => api.put(`/seo-by-ai/${clientId}/settings`, null, { params: settings }),
}

export default api
