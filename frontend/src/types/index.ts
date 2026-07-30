export interface Client {
  id: string
  agency_id: string
  name: string
  domain: string
  logo_url: string | null
  industry: string
  brand_colors: string[]
  brand_fonts: string[]
  keywords: string[]
  competitors: string[]
  marketing_goals: string
  status: 'active' | 'paused' | 'archived'
  created_at: string
}

export interface SEOAudit {
  id: string
  client_id: string
  overall_score: number
  performance_score: number
  accessibility_score: number
  seo_score: number
  best_practices_score: number
  core_web_vitals: Record<string, { value: number; unit: string; status: string }>
  mobile_issues: Array<{ issue: string; count: number; severity: string }>
  technical_issues: TechnicalIssue[]
  crawl_data: Record<string, number>
  status: string
  completed_at: string
}

export interface TechnicalIssue {
  id?: string
  category: string
  severity: 'critical' | 'warning' | 'info'
  title: string
  description: string
  url: string
  recommendation: string
}

export interface Keyword {
  id: string
  keyword: string
  search_volume: number
  keyword_difficulty: number
  cpc: number
  current_position: number
  previous_position: number
  url: string
  serp_features: string[]
  trend_data: number[]
  last_checked: string
}

export interface Backlink {
  id: string
  source_url: string
  target_url: string
  anchor_text: string
  domain_authority: number
  spam_score: number
  status: 'active' | 'lost' | 'broken'
  rel_type: 'follow' | 'nofollow'
  first_seen: string
  last_seen: string
}

export interface Content {
  id: string
  client_id: string
  title: string
  content_type: 'blog' | 'landing_page' | 'email' | 'ad_copy' | 'social_post'
  body: string
  meta_title: string
  meta_description: string
  target_keywords: string[]
  seo_score: number
  readability_score: number
  status: 'draft' | 'review' | 'published'
  ai_generated: boolean
  created_at: string
}

export interface Campaign {
  id: string
  client_id: string
  name: string
  campaign_type: 'seo' | 'content' | 'ads' | 'social' | 'email'
  status: 'draft' | 'active' | 'paused' | 'completed'
  start_date: string
  end_date: string
  budget: number
  spent?: number
  goals: string[]
  channels: string[]
  progress?: number
}

export interface SocialPost {
  id: string
  platform: string
  content: string
  media_urls: string[]
  scheduled_at: string | null
  published_at: string | null
  status: 'draft' | 'scheduled' | 'published'
  likes: number
  comments: number
  shares: number
  reach: number
}

export interface AdCampaign {
  id: string
  name: string
  platform: 'google' | 'facebook' | 'linkedin'
  status: 'active' | 'paused' | 'completed' | 'draft'
  budget_daily: number
  budget_total: number
  spend: number
  impressions: number
  clicks: number
  conversions: number
  ctr: number
  cpc: number
  cost_per_lead: number
  roas: number
}

export interface Report {
  id: string
  client_id: string
  title: string
  report_type: 'seo' | 'ads' | 'content' | 'competitor' | 'comprehensive'
  date_range_start: string
  date_range_end: string
  status: 'generating' | 'ready' | 'sent'
  generated_at: string | null
}

export interface Alert {
  id: string
  client_id: string
  alert_type: 'ranking_drop' | 'backlink_loss' | 'traffic_drop' | 'campaign_issue'
  severity: 'critical' | 'warning' | 'info'
  title: string
  message: string
  data: Record<string, unknown>
  is_read: boolean
  created_at: string
}

export interface Competitor {
  id: string
  client_id: string
  domain: string
  name: string
  domain_authority?: number
  organic_traffic?: number
  total_keywords?: number
  total_backlinks?: number
}

export interface GeneratedImage {
  id: string
  client_id: string
  prompt: string
  image_type: string
  image_url: string
  width: number
  height: number
  style: string
  status: string
  created_at: string
}
