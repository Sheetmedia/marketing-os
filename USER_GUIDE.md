# MarketingOS - Complete User Guide

> Your AI-Powered Marketing Operating System - Manage SEO, Content, Ads, Social Media, and more for all your clients from one platform.

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Dashboard Overview](#2-dashboard-overview)
3. [Managing Clients](#3-managing-clients)
4. [SEO Audit](#4-seo-audit)
5. [Keyword Intelligence](#5-keyword-intelligence)
6. [Backlink Intelligence](#6-backlink-intelligence)
7. [Competitor Intelligence](#7-competitor-intelligence)
8. [Content Studio](#8-content-studio)
9. [AI Image Studio](#9-ai-image-studio)
10. [Social Media Management](#10-social-media-management)
11. [Ads Manager](#11-ads-manager)
12. [Campaign Planner](#12-campaign-planner)
13. [Reports](#13-reports)
14. [AI Assistant](#14-ai-assistant)
15. [SEO By AI (Autopilot)](#15-seo-by-ai-autopilot)
16. [Alerts & Monitoring](#16-alerts--monitoring)
17. [Settings & Integrations](#17-settings--integrations)
18. [FAQ & Troubleshooting](#18-faq--troubleshooting)

---

## 1. Getting Started

### What is MarketingOS?

MarketingOS is an all-in-one AI-powered marketing platform designed for agencies and businesses that manage SEO and digital marketing. Whether you're managing 1 website or 100, MarketingOS gives you everything you need in one place:

- **SEO Analysis** - Audit websites, track keywords, monitor backlinks
- **AI Content Creation** - Generate blog posts, ad copy, emails with AI
- **AI Image Generation** - Create marketing visuals for social media and ads
- **Social Media Management** - Schedule posts, track engagement
- **Ad Campaign Management** - Monitor Google, Facebook, LinkedIn ads
- **Automated Reporting** - Generate client reports in one click
- **SEO By AI** - Let AI manage your entire SEO strategy on autopilot

### First Time Login

1. Open your browser and go to `http://localhost:3030`
2. You will see the login page
3. Enter your credentials:
   - **Email**: Your email address (default: `admin@marketingos.com`)
   - **Password**: Your password (default: `admin123`)
4. Click **"Sign In"**
5. You will be redirected to the Dashboard

### Navigating the Platform

The platform has a **sidebar** on the left with all the main sections:

| Icon | Section | What it does |
|------|---------|-------------|
| 📊 | Dashboard | Overview of all your marketing data |
| 🏢 | Clients | Manage your client companies |
| 🔍 | SEO Audit | Run website health checks |
| 🔑 | Keywords | Track and research keywords |
| 🔗 | Backlinks | Monitor your backlink profile |
| ⚔️ | Competitors | Analyze competitor websites |
| 📝 | Content Studio | Create AI-generated content |
| 🎨 | Image Studio | Generate marketing images with AI |
| 📱 | Social Media | Manage social media posts |
| 📢 | Ads Manager | Track ad campaigns |
| 🎯 | Campaigns | Plan marketing campaigns |
| 📈 | Reports | Generate performance reports |
| 🤖 | AI Assistant | Chat with your marketing AI |
| 🧠 | SEO By AI | Fully autonomous AI SEO management |
| 🔔 | Alerts | View important notifications |
| ⚙️ | Settings | Configure your account |

---

## 2. Dashboard Overview

The Dashboard is your command center. Here's what you'll see:

### Stats Cards (Top Row)
These show your key metrics at a glance:
- **Total Clients** - How many companies you're managing
- **Avg SEO Score** - Average health score across all clients
- **Keywords Tracked** - Total keywords being monitored
- **Total Backlinks** - Combined backlinks across all clients
- **Active Campaigns** - Currently running marketing campaigns
- **AI Content Generated** - Content pieces created by AI

### Charts
- **Organic Traffic Trend** - Shows how website traffic is growing over time
- **Keyword Rankings** - Distribution of where your keywords rank in Google

### Activity Feed
Shows recent events like completed audits, new backlinks, ranking changes.

---

## 3. Managing Clients

Clients are the companies/websites you manage. Everything in MarketingOS is organized by client.

### Adding a New Client

1. Click **"Clients"** in the sidebar
2. Click the **"Add Client"** button (top right)
3. Fill in the details:
   - **Company Name** - e.g., "Acme Corporation"
   - **Website Domain** - e.g., "acmecorp.com"
   - **Industry** - e.g., "Technology", "Healthcare", "Finance"
   - **Brand Colors** - Their brand colors (hex codes like #2563EB)
   - **Brand Fonts** - Their brand fonts
   - **Target Keywords** - Main keywords they want to rank for
   - **Competitors** - Competitor website domains
   - **Marketing Goals** - What they want to achieve
4. Click **"Create Client"**

### Viewing a Client

1. Click on any client card to open their detail page
2. You'll see tabs: **Overview, SEO, Keywords, Backlinks, Content, Campaigns, Reports**
3. The Overview tab shows:
   - SEO Score, Domain Authority, Traffic, Backlinks
   - Traffic chart over time
   - Brand kit (colors, fonts)
   - Competitor list

### Editing a Client

1. Go to the client detail page
2. Click the **"Edit"** button
3. Update any fields
4. Click **"Save"**

### Deleting a Client

1. Go to the client detail page
2. Click the **"Delete"** button
3. Confirm the deletion

> ⚠️ **Warning**: Deleting a client removes ALL their data (keywords, audits, content, etc.)

---

## 4. SEO Audit

The SEO Audit tool scans a website and identifies problems that affect search rankings.

### Running an Audit

1. Click **"SEO Audit"** in the sidebar
2. Select the client you want to audit
3. Click **"Run New Audit"**
4. Wait for the audit to complete (usually 2-5 minutes)

### Understanding the Results

#### Overall Score (0-100)
- **90-100** 🟢 Excellent - Website is well optimized
- **70-89** 🟡 Good - Some improvements needed
- **50-69** 🟠 Needs Work - Several issues found
- **0-49** 🔴 Critical - Major problems detected

#### Score Breakdown
- **Performance Score** - How fast the website loads
- **SEO Score** - On-page SEO optimization
- **Accessibility Score** - How accessible the site is
- **Best Practices Score** - Web development best practices

#### Core Web Vitals
Google uses these metrics to rank websites:
- **LCP (Largest Contentful Paint)** - How fast the main content loads
  - Good: < 2.5 seconds
  - Needs improvement: 2.5 - 4.0 seconds
  - Poor: > 4.0 seconds
- **FID (First Input Delay)** - How fast the site responds to clicks
  - Good: < 100ms
  - Needs improvement: 100 - 300ms
  - Poor: > 300ms
- **CLS (Cumulative Layout Shift)** - How stable the page layout is
  - Good: < 0.1
  - Needs improvement: 0.1 - 0.25
  - Poor: > 0.25

#### Technical Issues
Issues are categorized by severity:
- 🔴 **Critical** - Fix immediately (e.g., missing meta descriptions, broken links)
- 🟡 **Warning** - Should fix soon (e.g., slow images, duplicate titles)
- 🔵 **Info** - Nice to fix (e.g., missing alt text)

Each issue shows:
- What the problem is
- Which page is affected
- How to fix it

### What to Do After an Audit

1. Start with **Critical** issues first
2. Fix the issues on your website
3. Run another audit to verify the fixes
4. Move on to **Warning** and **Info** issues

---

## 5. Keyword Intelligence

Keywords are the search terms people type into Google. Tracking them helps you understand if your SEO is working.

### Adding Keywords to Track

1. Click **"Keywords"** in the sidebar
2. Click **"Add Keywords"**
3. Enter keywords one per line, or comma-separated:
   ```
   digital marketing tools
   SEO software
   content marketing strategy
   ```
4. Click **"Add"**

### Understanding the Keyword Table

| Column | What it means |
|--------|--------------|
| **Keyword** | The search term |
| **Position** | Where you rank in Google (1 = first result) |
| **Change** | ▲ Green = improved, ▼ Red = dropped |
| **Search Volume** | How many people search this per month |
| **Difficulty** | How hard it is to rank (0-100, higher = harder) |
| **CPC** | What advertisers pay per click (shows commercial value) |
| **SERP Features** | Special results like Featured Snippets, People Also Ask |
| **URL** | Which page on your site ranks for this keyword |

### Position Ranges - What They Mean

| Position | Meaning | Action |
|----------|---------|--------|
| 1-3 | 🏆 Top 3 - Excellent! | Maintain and protect |
| 4-10 | ✅ Page 1 - Great | Optimize to reach top 3 |
| 11-20 | 📄 Page 2 - Decent | Needs more work to reach page 1 |
| 21-50 | 📉 Pages 3-5 - Low visibility | Significant optimization needed |
| 50+ | ❌ Not visible | Consider new content strategy |

### Keyword Research

1. Click **"Research"** button
2. Enter seed keywords (topics related to your business)
3. Select target location and language
4. Click **"Research"**
5. Review AI-suggested keywords with their metrics
6. Check the ones you want to track
7. Click **"Add Selected to Tracking"**

### Keyword Groups

Organize keywords into groups for easier management:
1. Click **"Groups"** tab
2. Click **"Create Group"**
3. Name the group (e.g., "Product Keywords", "Blog Keywords")
4. Add keywords to the group

---

## 6. Backlink Intelligence

Backlinks are links from other websites to yours. They're one of Google's most important ranking factors.

### Viewing Your Backlink Profile

1. Click **"Backlinks"** in the sidebar
2. You'll see your overview:
   - **Total Backlinks** - Total links pointing to your site
   - **Referring Domains** - How many unique websites link to you
   - **Avg Domain Authority** - Average quality of linking sites
   - **Spam Score** - Percentage of potentially harmful links

### Understanding the Backlinks Table

| Column | What it means |
|--------|--------------|
| **Source URL** | The page that links to you |
| **Target URL** | Your page being linked to |
| **Anchor Text** | The clickable text of the link |
| **Domain Authority** | Quality of the linking site (0-100, higher = better) |
| **Spam Score** | Risk level (0% = safe, 100% = spammy) |
| **Status** | Active (still exists), Lost (removed), Broken (error) |
| **Rel Type** | Follow (passes SEO value) or Nofollow (doesn't) |

### What Makes a Good Backlink?

- ✅ High Domain Authority (40+)
- ✅ Low Spam Score (< 10%)
- ✅ Follow (dofollow) type
- ✅ Relevant to your industry
- ✅ Natural anchor text

### What to Watch For

- 🔴 **Lost Backlinks** - Check the "Lost" tab regularly. High-DA lost links should be recovered
- 🔴 **Toxic Links** - High spam score links can hurt your rankings. Consider disavowing them
- 🟢 **New Backlinks** - Celebrate these! They mean your content is being noticed

---

## 7. Competitor Intelligence

Understanding your competitors helps you find opportunities they're missing.

### Adding Competitors

1. Click **"Competitors"** in the sidebar
2. Click **"Add Competitor"**
3. Enter the competitor's domain (e.g., "competitor.com")
4. Enter their name
5. Click **"Add"**

### Analysis Types

#### Keyword Gap Analysis
Shows keywords your competitors rank for but you don't:
1. Click the **"Keyword Gap"** tab
2. Review the table showing:
   - Keywords only your competitors rank for (opportunities!)
   - Keywords you both rank for (competitive)
   - Keywords only you rank for (your advantages)
3. Click **"Add to Tracking"** on opportunity keywords

#### Content Gap Analysis
Topics your competitors cover but you don't:
1. Click the **"Content Gap"** tab
2. See which topics/pages drive traffic for competitors
3. Use this to plan new content

#### Backlink Gap Analysis
Websites that link to competitors but not to you:
1. Click the **"Backlink Gap"** tab
2. See domains linking to competitors
3. Click **"Outreach"** to plan reaching out to these sites

---

## 8. Content Studio

Create marketing content using AI. The AI writes SEO-optimized content based on your instructions.

### Creating Content with AI

1. Click **"Content Studio"** in the sidebar
2. Click **"Create Content"**
3. Choose the content type:
   - **Blog Article** - Full blog posts (500-3000+ words)
   - **Landing Page** - Sales/conversion page copy
   - **Email Campaign** - Marketing email content
   - **Ad Copy** - Short advertising text
   - **Social Post** - Social media captions
4. Fill in the details:
   - **Topic/Title** - What the content is about
   - **Target Keywords** - Keywords to optimize for (comma-separated)
   - **Tone** - Professional, Casual, Persuasive, Educational, Humorous
   - **Length** - Short, Medium, Long
   - **Additional Instructions** - Any specific requirements
5. Click **"Generate with AI"**
6. Wait for the AI to generate your content

### Editing Content

1. Click on any content piece to open it
2. **Left Panel** - Edit the content text
3. **Right Panel** - SEO Analysis showing:
   - ✅ Title tag present
   - ✅ Meta description present
   - ✅ Keyword density correct
   - ✅ Heading structure proper
   - ❌ Issues that need fixing
4. Edit the **Meta Title** and **Meta Description** fields
5. Click **"Save Draft"** or **"Publish"**

### Optimizing Content for SEO

1. Open any content piece
2. Click **"Optimize with AI"**
3. Enter target keywords
4. AI will suggest improvements to make the content rank better
5. Review and apply the suggestions

### Content Status Flow

```
Draft → Review → Published
```

- **Draft** - Work in progress
- **Review** - Ready for review/approval
- **Published** - Live on the website

---

## 9. AI Image Studio

Generate professional marketing images using AI. No design skills needed!

### Available Image Types

| Type | Dimensions | Best For |
|------|-----------|---------|
| Instagram Post | 1080 x 1080 | Instagram feed posts |
| Facebook Ad | 1200 x 628 | Facebook ad campaigns |
| LinkedIn Banner | 1584 x 396 | LinkedIn company page |
| Blog Thumbnail | 1200 x 630 | Blog post featured images |
| Website Banner | 1920 x 600 | Website hero sections |
| YouTube Thumbnail | 1280 x 720 | YouTube video thumbnails |

### Generating an Image

1. Click **"Image Studio"** in the sidebar
2. Select the image type (e.g., Instagram Post)
3. Write a description of what you want:
   - Example: "Modern tech company announcing a new AI product, blue and white color scheme, clean design with bold text"
4. Choose a style:
   - **Photorealistic** - Looks like a real photo
   - **Illustration** - Drawn/artistic style
   - **Minimal** - Clean, simple design
   - **Abstract** - Creative, artistic patterns
   - **Corporate** - Professional business style
   - **Vibrant** - Bright, colorful design
5. Optionally add:
   - **Brand Colors** - Your brand's hex color codes
   - **Text Overlay** - Text to display on the image
6. Click **"Generate Image"**

### Tips for Better Image Results

- Be specific in your description: "A professional woman using a laptop in a modern office" works better than "person with computer"
- Include color preferences: "blue and white color scheme"
- Mention the mood: "professional", "fun", "luxurious"
- Specify what NOT to include if needed

---

## 10. Social Media Management

Manage all your social media accounts from one place.

### Connecting Social Accounts

1. Click **"Social Media"** in the sidebar
2. Click **"Connect Account"**
3. Select the platform (Instagram, Facebook, LinkedIn, Twitter/X)
4. Follow the authorization process
5. Your account will appear in the connected accounts bar

### Creating a Social Post

1. Click **"Create Post"**
2. Select which platforms to post to (you can select multiple)
3. Write your post content
4. Add media (images, videos) by dragging into the upload area
5. Optionally click **"AI Caption"** to generate a caption:
   - Select a tone (Professional, Casual, Fun, Inspirational)
   - AI will generate a caption for you
6. Choose when to post:
   - **Post Now** - Publishes immediately
   - **Schedule** - Pick a date and time for future posting

### Content Calendar

1. Click the **"Calendar"** tab
2. See all your scheduled posts on a monthly calendar
3. Colored dots indicate which platform each post is for
4. Click any day to see/edit posts for that date
5. Use the arrows to navigate between months

### Social Analytics

1. Click the **"Analytics"** tab
2. View engagement metrics:
   - **Total Followers** - Across all platforms
   - **Engagement Rate** - How much your audience interacts
   - **Posts This Month** - How active you've been
3. See charts showing likes, comments, shares over time
4. Identify your top-performing posts

---

## 11. Ads Manager

Track and manage advertising campaigns across Google, Facebook, and LinkedIn.

### Connecting Ad Accounts

1. Click **"Ads Manager"** in the sidebar
2. Go to the **"Accounts"** tab
3. Click **"Connect"** next to the platform you want to add
4. Follow the authorization process

### Understanding Ad Metrics

| Metric | What it means | Good benchmark |
|--------|--------------|----------------|
| **Impressions** | How many times your ad was shown | More = more visibility |
| **Clicks** | How many people clicked your ad | -- |
| **CTR** | Click-Through Rate (clicks ÷ impressions × 100) | > 2% is good |
| **Conversions** | Actions taken (sign ups, purchases) | -- |
| **CPC** | Cost Per Click | Lower = better |
| **Cost Per Lead** | Cost per conversion | Depends on industry |
| **ROAS** | Return on Ad Spend (revenue ÷ spend) | > 3x is good |
| **Spend** | Total money spent | -- |

### Reading the Analytics

1. Click the **"Analytics"** tab
2. View:
   - **Spend vs Conversions** chart - Are you getting results for your money?
   - **CTR by Platform** - Which platform performs best?
   - **Cost per Lead** trend - Is it getting cheaper or more expensive?
   - **Conversion Funnel** - Where are people dropping off?

---

## 12. Campaign Planner

Plan and track complete marketing campaigns that span multiple channels.

### Creating a Campaign

1. Click **"Campaigns"** in the sidebar
2. Click **"New Campaign"**
3. Fill in:
   - **Campaign Name** - e.g., "Q2 Product Launch"
   - **Campaign Type** - SEO, Content, Ads, Social, Email
   - **Start Date** and **End Date**
   - **Budget** - Total campaign budget
   - **Goals** - What you want to achieve
   - **Channels** - Which marketing channels to use
4. Click **"Create"**

### Campaign Status Flow

```
Draft → Active → Paused (optional) → Completed
```

### Tracking Campaign Performance

1. Click on any campaign to see its detail view
2. View:
   - **Budget Progress** - How much has been spent vs total budget
   - **Key Metrics** - Impressions, clicks, conversions
   - **Performance Chart** - Results over the campaign duration
   - **Campaign Components** - Content, ads, social posts created for this campaign

---

## 13. Reports

Generate professional reports to share with clients or stakeholders.

### Report Types

| Type | What it includes |
|------|-----------------|
| **SEO Performance** | Traffic, rankings, technical health, recommendations |
| **Ad Campaign** | Spend, impressions, conversions, ROAS |
| **Content Performance** | Content metrics, engagement, SEO scores |
| **Competitor Comparison** | Side-by-side analysis with competitors |
| **Comprehensive** | Everything combined in one report |

### Generating a Report

1. Click **"Reports"** in the sidebar
2. Click **"Generate Report"**
3. Select:
   - **Client** - Which client the report is for
   - **Report Type** - What kind of report
   - **Date Range** - Start and end dates
   - **Sections to include** - Check which sections you want
4. Click **"Generate"**
5. Wait for the report to be generated

### Viewing and Sharing Reports

1. Click **"View"** on any report to preview it
2. The preview shows:
   - Executive Summary
   - Key Metrics
   - Charts and graphs
   - Recommendations
3. Click **"Download PDF"** to save as PDF
4. Click **"Send to Client"** to email the report

---

## 14. AI Assistant

Chat with your AI marketing assistant for strategy advice, content ideas, and SEO guidance.

### How to Use

1. Click **"AI Assistant"** in the sidebar
2. Type your question in the input box at the bottom
3. Press Enter or click Send

### Example Questions You Can Ask

**SEO Strategy:**
- "What are the best SEO strategies for my SaaS company?"
- "How can I improve my website's domain authority?"
- "What keywords should I target for a new blog?"

**Content Ideas:**
- "Generate 10 blog post ideas about digital marketing"
- "What topics are trending in the tech industry?"
- "Create an outline for a guide about email marketing"

**Campaign Planning:**
- "Help me plan a product launch campaign"
- "What's the best budget allocation for a $10,000 marketing campaign?"
- "What channels should I focus on for B2B marketing?"

**Analysis:**
- "Analyze my current SEO performance and suggest improvements"
- "What are my competitors doing that I'm not?"
- "Why did my traffic drop this month?"

### Tips for Better Responses

- Be specific: "How to rank for 'marketing automation tools'" is better than "How to do SEO"
- Provide context: "I run a B2B SaaS company with 10 employees" helps get relevant advice
- Ask follow-up questions to dive deeper

---

## 15. SEO By AI (Autopilot)

This is the most powerful feature - a fully autonomous AI agent named **Atlas** that manages your entire SEO and marketing strategy automatically.

### What Atlas Does

Atlas works 24/7 to:
- 🔍 **Monitor** - Continuously tracks all your SEO metrics, rankings, traffic, and backlinks
- 🧠 **Analyze** - Uses AI to identify patterns, opportunities, and threats
- 📋 **Plan** - Creates strategic plans and prioritizes actions
- ⚡ **Execute** - Automatically implements SEO fixes, creates content, schedules posts
- 📚 **Learn** - Adapts strategy based on what's working

### Getting Started with Atlas

1. Click **"SEO By AI"** in the sidebar
2. You'll see the Atlas dashboard with:
   - Agent status (active/inactive)
   - Lifetime statistics
   - AI insights and recommendations

### Understanding the Action Plan

Atlas creates an action plan organized by category:

| Category | Examples |
|----------|---------|
| **Technical SEO** | Fix meta descriptions, compress images, fix broken links |
| **Content Creation** | Generate blog articles, update outdated content |
| **Keyword Optimization** | Optimize title tags, add internal links |
| **Backlink Building** | Generate outreach emails, create linkable content |
| **Social Media** | Schedule posts, create content series |
| **Ad Optimization** | Create ad variants, reallocate budget |
| **Competitor Response** | Fill keyword gaps, target competitor backlink sources |
| **Reporting** | Generate weekly reports, send summaries |

### Auto vs. Approval Actions

- **Auto-executable** ✅ - Atlas does these automatically (e.g., fixing meta tags, generating content)
- **Needs Approval** 🔒 - Atlas asks your permission first (e.g., changing ad budgets, disavowing backlinks)

To approve/reject:
1. Go to the **Action Plan** tab
2. Find items marked "Pending Approval"
3. Click **"Approve"** or **"Reject"**

### Chatting with Atlas

1. Go to the **"Chat with Atlas"** tab
2. Ask questions about your SEO strategy:
   - "What's our current status?"
   - "What's the strategy for next month?"
   - "Why did our rankings drop?"
3. Atlas responds with data-backed insights and recommendations

### Configuring Autopilot Settings

1. Go to the **"Settings"** tab
2. Choose your automation level:
   - **Full Auto** - Atlas handles everything (recommended)
   - **Semi-Auto** - Atlas suggests, you approve
   - **Manual Review** - Atlas only monitors, you take action
3. Toggle individual features:
   - Auto-fix technical issues
   - Auto-generate content
   - Auto-optimize keywords
   - Auto-manage backlinks
   - Auto-schedule social media
   - Auto-optimize ads
4. Set cycle frequency (how often Atlas runs): Every 6 hours, Daily, Weekly
5. Set maximum daily actions
6. Click **"Save Settings"**

---

## 16. Alerts & Monitoring

Stay on top of important changes with real-time alerts.

### Alert Types

| Type | What it detects |
|------|----------------|
| **Ranking Drop** | A keyword dropped significantly in position |
| **Backlink Loss** | A valuable backlink was removed |
| **Traffic Drop** | Unusual decrease in website traffic |
| **Campaign Issue** | Ad campaign budget running low, ROAS dropping |

### Alert Severities

- 🔴 **Critical** - Requires immediate attention
- 🟡 **Warning** - Should be addressed soon
- 🔵 **Info** - Good to know, no action needed

### Managing Alerts

1. Click **"Alerts"** in the sidebar
2. Filter by type, severity, or read/unread status
3. Click on any alert to see details
4. Click **"Mark as Read"** after reviewing
5. Click **"Mark All Read"** to clear all notifications

### Alert Settings

1. Click the ⚙️ gear icon on the Alerts page
2. Configure:
   - **Ranking drop threshold** - Alert when position drops by X positions
   - **Traffic drop threshold** - Alert when traffic drops by X%
   - **Budget alert threshold** - Alert when ad spend reaches X% of budget
3. Choose notification channels:
   - Email notifications
   - Slack notifications
   - In-app notifications
4. Set alert frequency: Real-time, Hourly, Daily digest

---

## 17. Settings & Integrations

### Profile Settings

1. Click **"Settings"** in the sidebar
2. **Profile** tab:
   - Update your name, email
   - Change your password
   - Upload your avatar

### Agency Settings

1. **Agency** tab:
   - Update agency name and logo
   - View your subscription plan

### Integrations

Connect external services to enhance MarketingOS:

1. **Integrations** tab:
   - **Google Ads** - Import ad campaign data
   - **Facebook Ads** - Track Facebook/Instagram ads
   - **LinkedIn Ads** - Monitor LinkedIn campaigns
   - **Google Analytics** - Import website traffic data
   - **Google Search Console** - Import search performance data

To connect:
1. Click **"Connect"** next to the service
2. Follow the authorization flow
3. Grant MarketingOS access to your data
4. Data will start syncing automatically

### API Keys

For developers who want to integrate with MarketingOS:

1. **API Keys** tab
2. Click **"Generate New Key"**
3. Copy the key (it's only shown once!)
4. Use the key in your API calls with header: `Authorization: Bearer YOUR_KEY`

---

## 18. FAQ & Troubleshooting

### Common Questions

**Q: How often does keyword data update?**
A: Keyword positions are checked hourly when Atlas is active, or daily by default.

**Q: Can I manage multiple agencies?**
A: Currently, each installation supports one agency with multiple clients.

**Q: Is there a limit on how many clients I can add?**
A: The Professional plan supports up to 50 clients. Contact us for Enterprise plans.

**Q: How does AI content generation work?**
A: MarketingOS uses OpenAI's GPT-4 to generate content. You provide the topic, keywords, and tone, and the AI creates optimized content.

**Q: What happens if I disconnect an integration?**
A: Historical data is preserved, but new data won't sync until you reconnect.

**Q: Can I export my data?**
A: Yes, you can download reports as PDFs and export data through the API.

### Troubleshooting

**Login Issues:**
- Make sure caps lock is off
- Try resetting your password
- Clear browser cookies and try again

**Slow Loading:**
- Check your internet connection
- Try refreshing the page (Ctrl+R)
- Clear browser cache

**SEO Audit Not Completing:**
- Make sure the website is accessible (not behind a login)
- Check that the domain is correct
- Some very large sites may take longer

**AI Content Generation Fails:**
- Check that your OpenAI API key is configured in Settings
- Try with a shorter/simpler prompt
- Check your API usage limits

**Charts Not Loading:**
- Make sure you have data for the selected date range
- Try selecting a different time period
- Refresh the page

---

## Glossary

| Term | Definition |
|------|-----------|
| **SEO** | Search Engine Optimization - making websites rank higher in Google |
| **Domain Authority (DA)** | A score (0-100) predicting how well a site will rank. Higher = better |
| **Backlink** | A link from another website to yours |
| **Keyword** | A word or phrase people search for in Google |
| **SERP** | Search Engine Results Page - the Google results page |
| **CTR** | Click-Through Rate - percentage of people who click your link |
| **CPC** | Cost Per Click - what you pay per ad click |
| **ROAS** | Return On Ad Spend - revenue earned per dollar spent on ads |
| **Core Web Vitals** | Google's metrics for measuring website user experience |
| **Featured Snippet** | The answer box that appears at the top of Google results |
| **Meta Description** | The description shown in Google search results under your page title |
| **Alt Text** | Text description of an image (helps SEO and accessibility) |
| **Schema Markup** | Code that helps Google understand your content better |
| **Canonical URL** | The "official" version of a page when duplicates exist |
| **Nofollow** | A link attribute telling Google not to pass SEO value |
| **Dofollow** | A regular link that passes SEO value |
| **Organic Traffic** | Visitors who come from unpaid search results |
| **Bounce Rate** | Percentage of visitors who leave after viewing only one page |
| **Conversion** | When a visitor takes a desired action (sign up, purchase, etc.) |
| **E-E-A-T** | Experience, Expertise, Authoritativeness, Trustworthiness - Google's quality guidelines |

---

## Quick Reference - Common Workflows

### "I just added a new client. What should I do first?"

1. **Run an SEO Audit** → Fix critical issues
2. **Add Target Keywords** → Start tracking positions
3. **Add Competitors** → See keyword and content gaps
4. **Enable SEO By AI** → Let Atlas start optimizing

### "My client's rankings dropped. What should I do?"

1. Check **Alerts** for details on the drop
2. Run a new **SEO Audit** to check for technical issues
3. Check **Backlinks** for any lost high-DA links
4. Check **Competitors** to see if they made changes
5. Ask the **AI Assistant** for specific recommendations

### "I need to create content for a client"

1. Go to **Keywords** → Find high-opportunity keywords
2. Check **Competitors** → Content Gap tab for topic ideas
3. Go to **Content Studio** → Generate AI content
4. Optimize the content for SEO using the built-in analyzer
5. Create matching **social media posts** to promote it
6. Generate **marketing images** in Image Studio

### "I need to send a monthly report to my client"

1. Go to **Reports**
2. Click **"Generate Report"**
3. Select **"Comprehensive"** report type
4. Set date range to last month
5. Check all sections you want to include
6. Click **"Generate"**
7. Preview the report
8. Click **"Download PDF"** or **"Send to Client"**

---

*MarketingOS - AI Marketing Operating System*
*Built for agencies that want to scale their SEO and marketing operations with AI*
