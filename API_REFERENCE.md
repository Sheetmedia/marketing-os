# MarketingOS - API Reference

> Base URL: `http://localhost:3031/api/v1`
>
> All endpoints (except auth) require a Bearer token in the Authorization header.

---

## Authentication

### Login
```
POST /auth/login
```

**Request Body:**
```json
{
  "email": "admin@marketingos.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}
```

**Usage:** Include the token in all subsequent requests:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### Register
```
POST /auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "full_name": "John Doe"
}
```

### Get Current User
```
GET /auth/me
```

### Update Profile
```
PUT /auth/me
```
**Query Params:** `full_name`, `email`

---

## Clients

### List All Clients
```
GET /clients/
```
**Query Params:**
- `skip` (int, default: 0) - Pagination offset
- `limit` (int, default: 20) - Items per page
- `status` (string) - Filter: active, paused, archived
- `industry` (string) - Filter by industry
- `search` (string) - Search by name or domain

**Response:**
```json
{
  "clients": [
    {
      "id": "uuid",
      "name": "TechCorp Solutions",
      "domain": "techcorp.com",
      "industry": "Technology",
      "status": "active",
      "brand_colors": ["#2563EB", "#1E40AF"],
      "brand_fonts": ["Inter", "Roboto"],
      "keywords": ["seo", "marketing"],
      "competitors": ["competitor.com"],
      "marketing_goals": "Increase organic traffic by 50%",
      "created_at": "2024-06-15T10:00:00"
    }
  ],
  "total": 6
}
```

### Create Client
```
POST /clients/
```
**Query Params:** `name`, `domain`, `industry`, `marketing_goals`, `brand_colors`, `brand_fonts`, `keywords`, `competitors`

### Get Client
```
GET /clients/{client_id}
```

### Update Client
```
PUT /clients/{client_id}
```

### Delete Client
```
DELETE /clients/{client_id}
```

### Get Client Dashboard
```
GET /clients/{client_id}/dashboard
```

---

## SEO Audit

### Trigger SEO Audit
```
POST /seo/{client_id}/audit
```
Starts a background SEO audit for the client's website.

### List Audits
```
GET /seo/{client_id}/audits
```
**Query Params:** `skip`, `limit`

**Response:**
```json
{
  "audits": [
    {
      "id": "uuid",
      "client_id": "uuid",
      "overall_score": 76.0,
      "performance_score": 82.0,
      "seo_score": 71.0,
      "accessibility_score": 88.0,
      "best_practices_score": 79.0,
      "status": "completed",
      "created_at": "2024-06-15T10:00:00"
    }
  ],
  "total": 5
}
```

### Get Audit Details
```
GET /seo/{client_id}/audits/{audit_id}
```

### Get SEO Metrics
```
GET /seo/{client_id}/metrics
```
**Query Params:** `date_from`, `date_to`

Returns time-series SEO metrics (traffic, DA, backlinks, etc.)

### Get Technical Issues
```
GET /seo/{client_id}/technical-issues
```
**Query Params:** `severity` (critical/warning/info), `category`

---

## Keywords

### List Keywords
```
GET /keywords/{client_id}/keywords
```
**Query Params:**
- `skip`, `limit` - Pagination
- `search` - Search by keyword text
- `min_volume` - Minimum search volume
- `max_difficulty` - Maximum difficulty score
- `sort_by` - Column to sort (current_position, search_volume, difficulty, cpc)
- `sort_order` - asc or desc

**Response:**
```json
{
  "keywords": [
    {
      "id": "uuid",
      "keyword": "digital marketing tools",
      "current_position": 5,
      "previous_position": 8,
      "search_volume": 14800,
      "difficulty": 67.0,
      "cpc": 12.50,
      "target_url": "/blog/digital-marketing-tools",
      "trend_data": [45, 52, 48, 55, 60, 58],
      "created_at": "2024-06-15T10:00:00"
    }
  ],
  "total": 15
}
```

### Add Keywords
```
POST /keywords/{client_id}/keywords
```
**Query Params:** `keywords` - Comma-separated list of keywords

### Delete Keyword
```
DELETE /keywords/{client_id}/keywords/{keyword_id}
```

### Get Keyword Groups
```
GET /keywords/{client_id}/keywords/groups
```

### Research Keywords (AI)
```
POST /keywords/{client_id}/keywords/research
```
**Query Params:** `seed_keywords`, `location`, `language`

---

## Backlinks

### List Backlinks
```
GET /backlinks/{client_id}/backlinks
```
**Query Params:** `skip`, `limit`, `status` (active/lost), `rel_type` (follow/nofollow), `min_da`, `search`

### Get Backlink Profile
```
GET /backlinks/{client_id}/backlinks/profile
```

### Trigger Analysis
```
POST /backlinks/{client_id}/backlinks/analyze
```

### Get Lost Backlinks
```
GET /backlinks/{client_id}/backlinks/lost
```

### Get New Backlinks
```
GET /backlinks/{client_id}/backlinks/new
```

---

## Content Studio

### List Content
```
GET /content/{client_id}/content
```
**Query Params:** `skip`, `limit`, `content_type` (blog/landing_page/email/ad_copy), `content_status` (draft/review/published)

### Generate Content (AI)
```
POST /content/{client_id}/content/generate
```
**Query Params:** `content_type`, `topic`, `target_keywords`, `tone`, `length`

### Get Content
```
GET /content/{client_id}/content/{content_id}
```

### Update Content
```
PUT /content/{client_id}/content/{content_id}
```

### Delete Content
```
DELETE /content/{client_id}/content/{content_id}
```

### Optimize Content (AI)
```
POST /content/{client_id}/content/{content_id}/optimize
```

---

## Image Generation

### Generate Image (AI)
```
POST /images/{client_id}/images/generate
```
**Query Params:** `prompt`, `image_type` (instagram/facebook_ad/linkedin_banner/blog_thumbnail/website_banner/youtube_thumbnail), `style`, `brand_colors`, `text_overlay`

### List Images
```
GET /images/{client_id}/images
```

### Get Image
```
GET /images/{client_id}/images/{image_id}
```

### Delete Image
```
DELETE /images/{client_id}/images/{image_id}
```

---

## Social Media

### List Accounts
```
GET /social/{client_id}/social/accounts
```

### Connect Account
```
POST /social/{client_id}/social/accounts
```
**Query Params:** `platform`, `account_name`, `access_token`

### List Posts
```
GET /social/{client_id}/social/posts
```
**Query Params:** `platform`, `status`, `skip`, `limit`

### Create/Schedule Post
```
POST /social/{client_id}/social/posts
```
**Query Params:** `content`, `platform`, `media_urls`, `scheduled_at`

### Update Post
```
PUT /social/{client_id}/social/posts/{post_id}
```

### Delete Post
```
DELETE /social/{client_id}/social/posts/{post_id}
```

### Publish Post Now
```
POST /social/{client_id}/social/posts/{post_id}/publish
```

### Get Analytics
```
GET /social/{client_id}/social/analytics
```

---

## Ads Manager

### List Ad Accounts
```
GET /ads/{client_id}/ads/accounts
```

### Connect Ad Account
```
POST /ads/{client_id}/ads/accounts
```

### List Ad Campaigns
```
GET /ads/{client_id}/ads/campaigns
```
**Query Params:** `platform`, `status`

### Create Ad Campaign
```
POST /ads/{client_id}/ads/campaigns
```

### Get Campaign Details
```
GET /ads/{client_id}/ads/campaigns/{campaign_id}
```

### Update Campaign
```
PUT /ads/{client_id}/ads/campaigns/{campaign_id}
```

### Get Ad Analytics
```
GET /ads/{client_id}/ads/analytics
```

---

## Marketing Campaigns

### List Campaigns
```
GET /campaigns/
```
**Query Params:** `skip`, `limit`, `campaign_type`, `campaign_status`, `client_id`

### Create Campaign
```
POST /campaigns/
```

### Get Campaign
```
GET /campaigns/{campaign_id}
```

### Update Campaign
```
PUT /campaigns/{campaign_id}
```

### Delete Campaign
```
DELETE /campaigns/{campaign_id}
```

### Get Campaign Metrics
```
GET /campaigns/{campaign_id}/metrics
```

### Launch Campaign
```
POST /campaigns/{campaign_id}/launch
```

---

## Reports

### List Reports
```
GET /reports/{client_id}/reports
```
**Query Params:** `report_type`, `skip`, `limit`

### Generate Report
```
POST /reports/{client_id}/reports/generate
```
**Query Params:** `report_type` (seo/ads/content/competitor/comprehensive), `date_range_start`, `date_range_end`

### Get Report
```
GET /reports/{client_id}/reports/{report_id}
```

### Download Report
```
GET /reports/{client_id}/reports/{report_id}/download
```

---

## AI Assistant

### Chat
```
POST /ai/chat
```
**Query Params:** `message`, `client_id` (optional)

**Response:**
```json
{
  "response": "Here are my recommendations...",
  "suggestions": ["Follow-up question 1", "Follow-up question 2"],
  "sources": ["keyword_data", "seo_metrics"]
}
```

### Analyze Website
```
POST /ai/analyze
```
**Query Params:** `url`, `analysis_type`

### Get Recommendations
```
POST /ai/recommend
```

---

## Competitors

### List Competitors
```
GET /competitors/{client_id}/competitors
```

### Add Competitor
```
POST /competitors/{client_id}/competitors
```
**Query Params:** `domain`, `name`

### Delete Competitor
```
DELETE /competitors/{client_id}/competitors/{competitor_id}
```

### Get Competitor Analysis
```
GET /competitors/{client_id}/competitors/{competitor_id}/analysis
```

### Trigger Analysis
```
POST /competitors/{client_id}/competitors/analyze
```

### Keyword Gap Report
```
GET /competitors/{client_id}/competitors/keyword-gap
```

### Content Gap Report
```
GET /competitors/{client_id}/competitors/content-gap
```

### Backlink Gap Report
```
GET /competitors/{client_id}/competitors/backlink-gap
```

---

## Alerts

### List Alerts
```
GET /alerts/{client_id}/alerts
```
**Query Params:** `alert_type`, `severity`, `is_read` (true/false), `skip`, `limit`

### Mark Alert Read
```
PUT /alerts/{client_id}/alerts/{alert_id}/read
```

### Mark All Read
```
PUT /alerts/{client_id}/alerts/read-all
```

---

## SEO By AI (Autopilot)

### Get Autopilot Status
```
GET /seo-by-ai/{client_id}/status
```

### Run Autopilot Cycle
```
POST /seo-by-ai/{client_id}/run-cycle
```

### Get Action Plan
```
GET /seo-by-ai/{client_id}/action-plan
```

### Approve Action
```
POST /seo-by-ai/{client_id}/approve/{action_id}
```

### Reject Action
```
POST /seo-by-ai/{client_id}/reject/{action_id}
```

### Get AI Strategy
```
GET /seo-by-ai/{client_id}/strategy
```

### Get Deep Analysis
```
GET /seo-by-ai/{client_id}/deep-analysis
```

### Get Content Roadmap
```
GET /seo-by-ai/{client_id}/content-roadmap
```
**Query Params:** `months` (default: 3)

### Get AI Predictions
```
GET /seo-by-ai/{client_id}/predictions
```

### Get Execution History
```
GET /seo-by-ai/{client_id}/execution-history
```
**Query Params:** `days`, `category`

### Chat with Atlas
```
POST /seo-by-ai/{client_id}/chat
```
**Query Params:** `message`

### Update Settings
```
PUT /seo-by-ai/{client_id}/settings
```
**Query Params:** `mode`, `auto_fix_technical`, `auto_content`, `auto_keywords`, `auto_backlinks`, `auto_social`, `auto_ads`, `cycle_frequency`, `max_daily_actions`, `notification_level`

---

## Error Responses

All errors follow this format:
```json
{
  "detail": "Error message here"
}
```

| Status Code | Meaning |
|-------------|---------|
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 422 | Validation Error - Invalid data format |
| 500 | Server Error - Something went wrong |

---

## Rate Limits

- Standard: 100 requests per minute
- AI endpoints (content/image generation): 10 requests per minute
- SEO audit: 5 concurrent audits

---

## Interactive API Docs

Visit `http://localhost:3031/docs` for interactive Swagger UI documentation where you can test all endpoints directly in the browser.
