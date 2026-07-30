# MarketingOS API Documentation

## Base URL
```
http://localhost:8000/api/v1
```

## Authentication
All endpoints (except `/auth/login` and `/auth/register`) require a Bearer token.

```
Authorization: Bearer <jwt_token>
```

### POST /auth/register
Register a new user.
- **Params**: `email`, `password`, `full_name`
- **Response**: User object with id, email, role

### POST /auth/login
Authenticate and receive JWT token.
- **Params**: `email`, `password`
- **Response**: `{ "access_token": "...", "token_type": "bearer" }`

### GET /auth/me
Get current user profile.

### PUT /auth/me
Update current user profile.

---

## Clients

### GET /clients/
List all clients with pagination and filtering.
- **Query Params**: `skip`, `limit`, `status`, `industry`, `search`

### POST /clients/
Create a new client.
- **Params**: `name`, `domain`, `industry`, `marketing_goals`

### GET /clients/{client_id}
Get client details.

### PUT /clients/{client_id}
Update client.

### DELETE /clients/{client_id}
Delete client.

### GET /clients/{client_id}/dashboard
Get client dashboard summary with key metrics and trends.

---

## SEO

### POST /seo/{client_id}/audit
Trigger a new SEO audit (runs as background task).
- **Params**: `url` (optional), `crawl_depth` (default: 3)
- **Response**: `{ "audit_id": "...", "status": "queued" }`

### GET /seo/{client_id}/audits
List all SEO audits for a client.

### GET /seo/{client_id}/audits/{audit_id}
Get detailed audit results including:
- Overall scores (performance, SEO, accessibility, best practices)
- Core Web Vitals (LCP, FID, CLS, FCP, TTFB)
- Technical issues with severity and recommendations
- Mobile SEO issues
- Crawl data summary

### GET /seo/{client_id}/metrics
Get SEO metrics over time.
- **Query Params**: `date_from`, `date_to`

### GET /seo/{client_id}/technical-issues
Get technical SEO issues.
- **Query Params**: `severity`, `category`

---

## Keywords

### GET /keywords/{client_id}/keywords
List tracked keywords with filtering and sorting.
- **Query Params**: `skip`, `limit`, `sort_by`, `sort_order`, `search`, `min_volume`, `max_difficulty`

### POST /keywords/{client_id}/keywords
Add keywords to track.
- **Body**: `keywords` (list of strings)

### DELETE /keywords/{client_id}/keywords/{keyword_id}
Remove keyword from tracking.

### GET /keywords/{client_id}/keywords/groups
Get keyword groups.

### POST /keywords/{client_id}/keywords/groups
Create keyword group.
- **Params**: `name`, `keyword_ids`

### POST /keywords/{client_id}/keywords/research
AI-powered keyword research.
- **Params**: `seed_keywords` (list), `location`, `language`

### GET /keywords/{client_id}/keywords/rankings
Get keyword ranking history.
- **Query Params**: `keyword_id`, `days`

---

## Backlinks

### GET /backlinks/{client_id}/backlinks
List backlinks with filtering.
- **Query Params**: `skip`, `limit`, `status`, `rel_type`, `min_da`, `search`

### GET /backlinks/{client_id}/backlinks/profile
Get backlink profile summary (totals, DA distribution, trends).

### POST /backlinks/{client_id}/backlinks/analyze
Trigger backlink analysis.

### GET /backlinks/{client_id}/backlinks/lost
Get recently lost backlinks.

### GET /backlinks/{client_id}/backlinks/new
Get newly discovered backlinks.

---

## Competitors

### GET /competitors/{client_id}/competitors
List tracked competitors.

### POST /competitors/{client_id}/competitors
Add a competitor.
- **Params**: `domain`, `name`

### DELETE /competitors/{client_id}/competitors/{competitor_id}
Remove competitor.

### GET /competitors/{client_id}/competitors/{competitor_id}/analysis
Get detailed competitor analysis.

### POST /competitors/{client_id}/competitors/analyze
Trigger fresh competitor analysis.

### GET /competitors/{client_id}/competitors/keyword-gap
Get keyword gap report (your keywords vs competitor keywords).

### GET /competitors/{client_id}/competitors/content-gap
Get content gap report (topics competitors cover that you don't).

### GET /competitors/{client_id}/competitors/backlink-gap
Get backlink gap report (domains linking to competitors but not you).

---

## Content Studio

### GET /content/{client_id}/content
List content pieces.
- **Query Params**: `skip`, `limit`, `content_type`, `content_status`

### POST /content/{client_id}/content/generate
AI-generate marketing content.
- **Params**: `content_type` (blog/landing_page/email/ad_copy/social_post), `topic`, `target_keywords`, `tone`, `length`, `additional_instructions`

### GET /content/{client_id}/content/{content_id}
Get a content piece.

### PUT /content/{client_id}/content/{content_id}
Update content.

### DELETE /content/{client_id}/content/{content_id}
Delete content.

### POST /content/{client_id}/content/{content_id}/optimize
AI optimize content for SEO.

---

## Image Studio

### POST /images/{client_id}/images/generate
Generate marketing image via AI.
- **Params**: `prompt`, `image_type` (instagram/facebook_ad/linkedin_banner/blog_thumbnail/website_banner/youtube_thumbnail), `style`, `brand_colors`, `text_overlay`

### GET /images/{client_id}/images
List generated images.

### GET /images/{client_id}/images/{image_id}
Get image details.

### DELETE /images/{client_id}/images/{image_id}
Delete image.

---

## Social Media

### GET /social/{client_id}/accounts
List connected social accounts.

### POST /social/{client_id}/accounts
Connect social account.

### GET /social/{client_id}/posts
List posts.
- **Query Params**: `skip`, `limit`, `platform`, `post_status`

### POST /social/{client_id}/posts
Create/schedule a post.

### PUT /social/{client_id}/posts/{post_id}
Update post.

### DELETE /social/{client_id}/posts/{post_id}
Delete post.

### GET /social/{client_id}/calendar
Get content calendar.

### POST /social/{client_id}/posts/{post_id}/publish
Publish post immediately.

### GET /social/{client_id}/analytics
Get social media analytics.

---

## Ads Manager

### GET /ads/{client_id}/accounts
List connected ad accounts.

### POST /ads/{client_id}/accounts
Connect ad account.

### GET /ads/{client_id}/campaigns
List ad campaigns.
- **Query Params**: `platform`, `campaign_status`

### POST /ads/{client_id}/campaigns
Create ad campaign.

### GET /ads/{client_id}/campaigns/{campaign_id}
Get campaign details with daily metrics.

### PUT /ads/{client_id}/campaigns/{campaign_id}
Update campaign.

### GET /ads/{client_id}/analytics
Get advertising analytics.
- **Query Params**: `platform`, `date_from`, `date_to`

---

## Marketing Campaigns

### GET /campaigns/
List marketing campaigns.
- **Query Params**: `skip`, `limit`, `campaign_type`, `campaign_status`

### POST /campaigns/
Create marketing campaign.

### GET /campaigns/{campaign_id}
Get campaign details with metrics and components.

### PUT /campaigns/{campaign_id}
Update campaign.

### DELETE /campaigns/{campaign_id}
Delete campaign.

### GET /campaigns/{campaign_id}/metrics
Get campaign performance metrics.

### POST /campaigns/{campaign_id}/launch
Launch a campaign.

---

## Reports

### GET /reports/{client_id}/reports
List generated reports.
- **Query Params**: `skip`, `limit`, `report_type`

### POST /reports/{client_id}/reports/generate
Generate a new report (async).
- **Params**: `report_type` (seo/ads/content/competitor/comprehensive), `date_range_start`, `date_range_end`

### GET /reports/{client_id}/reports/{report_id}
Get report with data.

### GET /reports/{client_id}/reports/{report_id}/download
Download report PDF.

---

## AI Assistant

### POST /ai/chat
Chat with AI marketing assistant.
- **Params**: `message`, `client_id` (optional), `context` (optional)

### POST /ai/analyze
AI-powered website analysis.
- **Params**: `url`, `analysis_type`

### POST /ai/recommend
Get AI SEO/marketing recommendations.
- **Params**: `client_id`, `focus_area` (optional)

---

## Alerts

### GET /alerts/{client_id}/alerts
List alerts.
- **Query Params**: `alert_type`, `severity`, `is_read`, `skip`, `limit`

### PUT /alerts/{client_id}/alerts/{alert_id}/read
Mark alert as read.

### PUT /alerts/{client_id}/alerts/read-all
Mark all alerts as read.

### GET /alerts/{client_id}/alerts/settings
Get alert settings.

### PUT /alerts/{client_id}/alerts/settings
Update alert settings.

---

## Interactive API Docs

FastAPI auto-generates interactive documentation:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

## Error Responses

All errors follow this format:
```json
{
  "detail": "Error message description"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `202` - Accepted (async task queued)
- `204` - No Content (deleted)
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error
