"""
Database Seed Script for MarketingOS

Populates the database with realistic initial data for demo/development.
Run with: python seed.py
"""

import asyncio
import uuid
import random
from datetime import datetime, timedelta, timezone
from core.database import async_session, init_db
from core.security import get_password_hash
from models.user import User
from models.agency import Agency
from models.client import Client
from models.seo import SEOAudit, SEOMetrics, TechnicalSEOIssue
from models.keyword import Keyword, KeywordGroup
from models.backlink import Backlink, BacklinkProfile
from models.content import Content
from models.campaign import Campaign, CampaignMetrics
from models.social_media import SocialAccount, SocialPost
from models.ads import AdAccount, AdCampaign, AdMetrics
from models.report import Report
from models.alert import Alert
from models.competitor import Competitor, CompetitorAnalysis
from models.image import GeneratedImage


async def seed():
    await init_db()

    async with async_session() as db:
        print("Seeding database...")

        # 1. Create Agency
        agency_id = uuid.uuid4()
        agency = Agency(
            id=agency_id,
            name="Digital Growth Agency",
            slug="digital-growth-agency",
            subscription_plan="professional",
            max_clients=50,
            is_active=True,
        )
        db.add(agency)

        # 2. Create Admin User
        admin_id = uuid.uuid4()
        admin = User(
            id=admin_id,
            email="admin@marketingos.com",
            full_name="Admin User",
            hashed_password=get_password_hash("admin123"),
            role="agency_admin",
            is_active=True,
            agency_id=agency_id,
        )
        db.add(admin)

        # 3. Create 6 Clients
        clients_data = [
            {"name": "TechCorp Solutions", "domain": "techcorp.com", "industry": "Technology", "brand_colors": ["#2563EB", "#1E40AF", "#DBEAFE"], "brand_fonts": ["Inter", "Roboto"], "marketing_goals": "Increase organic traffic by 50% and generate 200 qualified leads per month"},
            {"name": "GrowthCo Marketing", "domain": "growthco.io", "industry": "Marketing", "brand_colors": ["#059669", "#047857", "#D1FAE5"], "brand_fonts": ["Poppins", "Open Sans"], "marketing_goals": "Build brand authority and double MQL pipeline"},
            {"name": "MarketPro Analytics", "domain": "marketpro.co", "industry": "Analytics", "brand_colors": ["#7C3AED", "#6D28D9", "#EDE9FE"], "brand_fonts": ["Montserrat", "Lato"], "marketing_goals": "Establish thought leadership and drive product signups"},
            {"name": "FinServe Digital", "domain": "finserve.com", "industry": "Finance", "brand_colors": ["#DC2626", "#B91C1C", "#FEE2E2"], "brand_fonts": ["Merriweather", "Source Sans Pro"], "marketing_goals": "Increase brand awareness and reduce CAC by 30%"},
            {"name": "HealthWell Inc", "domain": "healthwell.org", "industry": "Healthcare", "brand_colors": ["#0891B2", "#0E7490", "#CFFAFE"], "brand_fonts": ["Nunito", "Raleway"], "marketing_goals": "Drive patient acquisition and improve digital presence"},
            {"name": "EduLearn Platform", "domain": "edulearn.com", "industry": "Education", "brand_colors": ["#EA580C", "#C2410C", "#FED7AA"], "brand_fonts": ["Quicksand", "Cabin"], "marketing_goals": "Scale user acquisition to 100K monthly active learners"},
        ]

        client_ids = []
        for i, cd in enumerate(clients_data):
            cid = uuid.uuid4()
            client_ids.append(cid)
            status = "active" if i != 4 else "paused"
            client = Client(
                id=cid, agency_id=agency_id, status=status,
                keywords=["keyword1", "keyword2", "keyword3"],
                competitors=["competitor1.com", "competitor2.com"],
                **cd
            )
            db.add(client)

        await db.flush()
        print(f"  Created {len(clients_data)} clients")

        # 4. Seed SEO Audits and Metrics for each client
        for cid in client_ids:
            # SEO Audit
            audit = SEOAudit(
                id=uuid.uuid4(), client_id=cid,
                audit_type="full",
                overall_score=random.randint(60, 90),
                performance_score=random.randint(65, 95),
                accessibility_score=random.randint(70, 98),
                seo_score=random.randint(55, 85),
                best_practices_score=random.randint(70, 92),
                results={
                    "core_web_vitals": {"lcp": {"value": round(random.uniform(1.5, 3.5), 1), "unit": "s", "status": "good"}, "fid": {"value": random.randint(50, 150), "unit": "ms", "status": "good"}, "cls": {"value": round(random.uniform(0.05, 0.2), 2), "unit": "", "status": "needs_improvement"}},
                    "mobile_issues": [{"issue": "Tap targets too small", "count": random.randint(0, 5), "severity": "warning"}],
                    "crawl_data": {"pages_crawled": random.randint(50, 300), "broken_links": random.randint(0, 10), "redirect_chains": random.randint(0, 5)},
                },
                recommendations=["Optimize images for faster load times", "Add missing meta descriptions", "Fix broken internal links", "Improve mobile responsiveness"],
                status="completed",
            )
            db.add(audit)

            # Technical Issues
            issues = [
                ("missing_meta_description", "critical", "/products", "Missing meta descriptions on product pages", "Add unique meta descriptions to all product pages"),
                ("large_images", "critical", "/gallery", "Large image files exceeding 500KB found", "Compress images and serve in WebP format"),
                ("broken_links", "warning", "/about", "Broken internal links detected", "Fix or remove broken internal links"),
                ("duplicate_titles", "warning", "/blog", "Duplicate title tags across multiple pages", "Write unique title tags for each page"),
                ("render_blocking", "warning", "/", "Render-blocking CSS/JS resources", "Defer non-critical CSS and JS loading"),
                ("missing_alt_text", "info", "/products", "Images missing alt text attributes", "Add descriptive alt text to all images"),
                ("missing_h1", "warning", "/services", "Pages missing H1 heading tags", "Add a single H1 tag to each page"),
                ("redirect_chains", "info", "/old-page", "Redirect chains with 3+ hops detected", "Simplify redirect chains to single redirects"),
            ]
            for issue_type, sev, page_url, desc, rec in issues:
                db.add(TechnicalSEOIssue(
                    id=uuid.uuid4(), audit_id=audit.id,
                    issue_type=issue_type, severity=sev,
                    page_url=page_url, description=desc,
                    recommendation=rec, is_resolved=False,
                ))

            # SEO Metrics (6 months)
            base_traffic = random.randint(15000, 35000)
            for month in range(6):
                d = datetime.now(timezone.utc) - timedelta(days=30 * (5 - month))
                traffic = int(base_traffic * (1 + 0.05 * month + random.uniform(-0.02, 0.03)))
                impressions = traffic * random.randint(8, 15)
                clicks = traffic
                db.add(SEOMetrics(
                    id=uuid.uuid4(), client_id=cid, date=d,
                    organic_traffic=traffic,
                    organic_keywords=random.randint(200, 800) + month * 20,
                    domain_authority=random.randint(30, 55) + month,
                    page_authority=random.randint(25, 50) + month,
                    backlinks_count=random.randint(500, 2000) + month * 30,
                    referring_domains=random.randint(100, 500) + month * 10,
                    avg_position=round(random.uniform(8.0, 25.0), 1),
                    impressions=impressions,
                    clicks=clicks,
                    ctr=round(clicks / max(impressions, 1) * 100, 2),
                    bounce_rate=round(random.uniform(35.0, 65.0), 1),
                    avg_session_duration=round(random.uniform(90.0, 240.0), 1),
                    pages_per_session=round(random.uniform(1.5, 4.5), 1),
                ))

        print("  Created SEO audits and metrics")

        # 5. Keywords (15 per client for first 3 clients)
        keyword_data = [
            ("digital marketing tools", 14800, 67, 12.50), ("SEO software", 22100, 78, 18.30),
            ("content marketing strategy", 9900, 55, 8.75), ("email marketing automation", 6600, 62, 15.20),
            ("social media management", 33100, 82, 11.40), ("marketing analytics platform", 4400, 48, 22.10),
            ("lead generation software", 8100, 71, 25.80), ("keyword research tool", 12100, 73, 14.60),
            ("backlink checker", 18100, 69, 9.90), ("website audit tool", 5400, 52, 16.40),
            ("competitor analysis tool", 7200, 58, 13.80), ("marketing campaign management", 3600, 45, 19.50),
            ("AI content generator", 27100, 75, 10.20), ("landing page builder", 40500, 85, 8.90),
            ("PPC management software", 2900, 42, 28.60),
        ]
        intents = ["informational", "commercial", "transactional", "navigational"]
        for cid in client_ids[:3]:
            for kw, vol, diff, cpc in keyword_data:
                pos = random.randint(1, 50)
                db.add(Keyword(
                    id=uuid.uuid4(), client_id=cid, keyword=kw,
                    search_volume=vol, difficulty=diff, cpc=cpc,
                    current_position=pos, previous_position=pos + random.randint(-5, 5),
                    target_url=f"/blog/{kw.replace(' ', '-')}",
                    intent=random.choice(intents),
                    trend_data=[random.randint(20, 80) for _ in range(6)],
                    is_tracked=True,
                ))
        print("  Created keywords")

        # 6. Backlinks (12 per client for first 3 clients)
        backlink_sources = [
            ("https://techcrunch.com/article/best-tools", "marketing platform", 92, 85, 1, "dofollow"),
            ("https://forbes.com/advisor/software", "MarketingOS", 95, 88, 0, "dofollow"),
            ("https://blog.hubspot.com/tools", "SEO best practices", 88, 80, 1, "dofollow"),
            ("https://searchenginejournal.com/tools", "keyword research", 85, 78, 2, "dofollow"),
            ("https://neilpatel.com/blog/tools", "click here", 80, 72, 3, "nofollow"),
            ("https://medium.com/@marketer/review", "marketing review", 72, 65, 5, "nofollow"),
            ("https://g2.com/products/marketingos", "Reviews", 89, 82, 1, "nofollow"),
            ("https://entrepreneur.com/tools", "AI marketing", 91, 84, 0, "dofollow"),
            ("https://marketing-weekly.com/picks", "top platform", 55, 48, 4, "dofollow"),
            ("https://adweek.com/technology", "marketing tech", 82, 75, 2, "dofollow"),
            ("https://old-blog.example.com/seo", "seo guide", 35, 28, 15, "dofollow"),
            ("https://spammy-directory.com/list", "best marketing", 12, 8, 85, "dofollow"),
        ]
        for cid in client_ids[:3]:
            # Backlink Profile (must be created first since backlinks reference it)
            profile_id = uuid.uuid4()
            dofollow = sum(1 for _, _, _, _, _, rel in backlink_sources if rel == "dofollow")
            nofollow = len(backlink_sources) - dofollow
            db.add(BacklinkProfile(
                id=profile_id, client_id=cid,
                total_backlinks=random.randint(800, 15000),
                referring_domains=random.randint(200, 1500),
                domain_authority=random.randint(35, 55),
                spam_score=round(random.uniform(1.5, 5.0), 1),
                dofollow_count=random.randint(500, 10000),
                nofollow_count=random.randint(200, 3000),
                last_crawled_at=datetime.now(timezone.utc),
            ))

            for src, anchor, da, pa, spam, rel in backlink_sources:
                is_active = True if da > 30 else random.choice([True, False])
                db.add(Backlink(
                    id=uuid.uuid4(), profile_id=profile_id,
                    source_url=src, target_url=random.choice(["/", "/products", "/blog"]),
                    anchor_text=anchor, domain_authority=da, page_authority=pa,
                    spam_score=spam, rel_type=rel, is_active=is_active,
                    first_seen=datetime.now(timezone.utc) - timedelta(days=random.randint(30, 180)),
                    last_seen=datetime.now(timezone.utc) - timedelta(days=random.randint(0, 10)),
                ))
        print("  Created backlinks")

        # 7. Content (8 per client for first 3)
        content_items = [
            ("The Ultimate Guide to SEO in 2024", "blog_post", "published", 92, 78, True, "seo"),
            ("10 Content Marketing Strategies That Drive Results", "blog_post", "published", 85, 82, True, "content marketing"),
            ("Product Launch Landing Page", "landing_page", "published", 88, 75, False, "product launch"),
            ("Summer Sale Email Campaign", "email", "published", 0, 88, True, "summer sale"),
            ("Google Ads Copy - Brand Campaign", "ad_copy", "published", 0, 90, True, "brand awareness"),
            ("How to Build a Backlink Strategy", "blog_post", "draft", 72, 80, True, "backlinks"),
            ("Social Media Best Practices Guide", "blog_post", "review", 65, 84, False, "social media"),
            ("PPC Campaign Landing Page", "landing_page", "draft", 80, 76, True, "ppc"),
        ]
        for cid in client_ids[:3]:
            for title, ctype, cstatus, seo_sc, read_sc, ai_gen, target_kw in content_items:
                slug = title.lower().replace(" ", "-").replace("---", "-")
                body = f"Full content for: {title}. This is a comprehensive piece covering all aspects of the topic with actionable insights and expert recommendations."
                db.add(Content(
                    id=uuid.uuid4(), client_id=cid, title=title, slug=slug,
                    content_type=ctype,
                    body=body,
                    meta_title=f"{title} | Expert Guide",
                    meta_description=f"Learn about {title.lower()}. Expert insights and proven strategies.",
                    target_keyword=target_kw,
                    secondary_keywords=[title.split()[0].lower(), title.split()[-1].lower()],
                    word_count=len(body.split()) * random.randint(10, 20),
                    seo_score=seo_sc, readability_score=read_sc,
                    tone="professional",
                    language="en",
                    status=cstatus, ai_generated=ai_gen,
                    ai_model_used="gpt-4" if ai_gen else None,
                    published_at=datetime.now(timezone.utc) - timedelta(days=random.randint(1, 30)) if cstatus == "published" else None,
                ))
        print("  Created content")

        # 8. Campaigns
        campaign_data = [
            ("Q2 SEO Growth Initiative", "seo", "active", 15000),
            ("Summer Product Launch", "ads", "active", 25000),
            ("Content Authority Building", "content", "active", 12000),
            ("Social Media Blitz", "social", "active", 8000),
            ("Q1 Email Nurture Series", "email", "completed", 5000),
        ]
        for cid in client_ids[:3]:
            for name, ctype, cstatus, budget in campaign_data:
                camp_id = uuid.uuid4()
                db.add(Campaign(
                    id=camp_id, client_id=cid, name=name,
                    description=f"Campaign focused on {ctype} channel to drive growth.",
                    campaign_type=ctype, status=cstatus,
                    start_date=datetime.now(timezone.utc) - timedelta(days=random.randint(30, 90)),
                    end_date=datetime.now(timezone.utc) + timedelta(days=random.randint(30, 90)),
                    budget=budget,
                    goals=[f"Goal 1 for {name}", f"Goal 2 for {name}"],
                    channels=[ctype, "content"],
                ))
                # Campaign metrics
                for day in range(5):
                    impressions = random.randint(10000, 50000)
                    clicks = random.randint(400, 2000)
                    conversions = random.randint(10, 50)
                    spend = round(random.uniform(100, 500), 2)
                    revenue = round(random.uniform(500, 3000), 2)
                    db.add(CampaignMetrics(
                        id=uuid.uuid4(), campaign_id=camp_id,
                        date=datetime.now(timezone.utc) - timedelta(days=day),
                        impressions=impressions,
                        clicks=clicks,
                        conversions=conversions,
                        spend=spend,
                        revenue=revenue,
                        roi=round((revenue - spend) / max(spend, 1) * 100, 2),
                        ctr=round(clicks / max(impressions, 1) * 100, 2),
                        cpc=round(spend / max(clicks, 1), 2),
                        cpa=round(spend / max(conversions, 1), 2),
                    ))
        print("  Created campaigns")

        # 9. Social Media
        platforms = ["instagram", "facebook", "linkedin", "twitter"]
        # Track account IDs per client so we can assign posts to them
        client_social_accounts = {}
        for cid in client_ids[:3]:
            client_social_accounts[cid] = {}
            for plat in platforms:
                acc_id = uuid.uuid4()
                client_social_accounts[cid][plat] = acc_id
                db.add(SocialAccount(
                    id=acc_id, client_id=cid, platform=plat,
                    account_name=f"@client_{plat}",
                    account_id=f"{plat}_{random.randint(100000, 999999)}",
                    access_token="token_placeholder",
                    followers_count=random.randint(1000, 50000),
                    is_connected=plat != "twitter",
                ))
            # Posts
            post_contents = [
                ("Excited to announce our new AI-powered dashboard!", "instagram", "published"),
                ("5 Ways AI is Transforming Digital Marketing", "linkedin", "published"),
                ("Check out our latest blog post on SEO!", "facebook", "published"),
                ("New feature alert: AI Content Studio!", "twitter", "scheduled"),
                ("Marketing tip of the day: consistency beats perfection.", "instagram", "published"),
                ("Join our free webinar on marketing automation!", "facebook", "draft"),
                ("Behind the scenes at our HQ!", "instagram", "published"),
                ("Case Study: How we grew organic traffic 156%", "linkedin", "published"),
            ]
            for content, plat, pstatus in post_contents:
                db.add(SocialPost(
                    id=uuid.uuid4(),
                    account_id=client_social_accounts[cid][plat],
                    content=content,
                    media_urls=[],
                    hashtags=["#marketing", "#digital", "#growth"],
                    post_type="text",
                    status=pstatus,
                    scheduled_at=datetime.now(timezone.utc) + timedelta(days=random.randint(1, 14)) if pstatus == "scheduled" else None,
                    published_at=datetime.now(timezone.utc) - timedelta(days=random.randint(1, 30)) if pstatus == "published" else None,
                    likes=random.randint(50, 500) if pstatus == "published" else 0,
                    comments=random.randint(5, 50) if pstatus == "published" else 0,
                    shares=random.randint(5, 80) if pstatus == "published" else 0,
                    reach=random.randint(1000, 25000) if pstatus == "published" else 0,
                    engagement_rate=round(random.uniform(1.5, 8.0), 2) if pstatus == "published" else 0.0,
                ))
        print("  Created social media data")

        # 10. Ads
        for cid in client_ids[:3]:
            ad_account_ids = {}
            for plat in ["google", "facebook", "linkedin"]:
                acc_id = uuid.uuid4()
                ad_account_ids[plat] = acc_id
                db.add(AdAccount(
                    id=acc_id, client_id=cid, platform=plat,
                    account_name=f"{plat.title()} Ads Account",
                    account_id=f"{plat}-{random.randint(100000, 999999)}",
                    is_connected=plat != "linkedin",
                    currency="USD",
                    timezone="America/New_York",
                ))
            ad_campaigns = [
                ("Brand Awareness - Q2", "google", "active", "daily", 150),
                ("Summer Sale Campaign", "facebook", "active", "daily", 200),
                ("Product Launch - LinkedIn", "linkedin", "active", "daily", 100),
                ("Retargeting - All Platforms", "google", "active", "daily", 75),
                ("Content Promotion", "facebook", "paused", "daily", 50),
                ("Lead Gen - Search Ads", "google", "completed", "daily", 120),
            ]
            for name, plat, astatus, budget_type, budget_amount in ad_campaigns:
                ad_id = uuid.uuid4()
                db.add(AdCampaign(
                    id=ad_id,
                    ad_account_id=ad_account_ids[plat],
                    name=name,
                    objective="conversions",
                    status=astatus,
                    budget_type=budget_type,
                    budget_amount=budget_amount,
                    start_date=datetime.now(timezone.utc) - timedelta(days=random.randint(30, 120)),
                    end_date=datetime.now(timezone.utc) + timedelta(days=random.randint(30, 90)),
                    targeting={"locations": ["US"], "age_range": "25-54", "interests": ["marketing", "technology"]},
                    ad_creatives=[{"headline": f"Ad for {name}", "description": "Boost your marketing today"}],
                ))
                for day in range(5):
                    day_imp = random.randint(10000, 20000)
                    day_clicks = int(day_imp * random.uniform(0.02, 0.06))
                    day_conv = int(day_clicks * random.uniform(0.02, 0.08))
                    day_spend = round(random.uniform(50, 200), 2)
                    day_revenue = round(random.uniform(200, 1200), 2)
                    db.add(AdMetrics(
                        id=uuid.uuid4(), ad_campaign_id=ad_id,
                        date=datetime.now(timezone.utc) - timedelta(days=day),
                        impressions=day_imp, clicks=day_clicks, conversions=day_conv,
                        spend=day_spend,
                        revenue=day_revenue,
                        ctr=round(day_clicks / day_imp * 100, 2),
                        cpc=round(day_spend / max(day_clicks, 1), 2),
                        cpa=round(day_spend / max(day_conv, 1), 2),
                        roas=round(day_revenue / max(day_spend, 1), 2),
                        quality_score=round(random.uniform(5.0, 10.0), 1),
                    ))
        print("  Created ads data")

        # 11. Reports
        report_types = ["seo", "ads", "content", "competitor", "comprehensive"]
        for cid in client_ids[:3]:
            for rtype in report_types:
                db.add(Report(
                    id=uuid.uuid4(), client_id=cid,
                    title=f"{rtype.title()} Performance Report - {datetime.now().strftime('%B %Y')}",
                    report_type=rtype,
                    description=f"Auto-generated {rtype} performance report with key metrics and insights.",
                    date_range_start=datetime.now(timezone.utc) - timedelta(days=30),
                    date_range_end=datetime.now(timezone.utc),
                    data={"summary": f"Auto-generated {rtype} report", "metrics": {}},
                    summary=f"This {rtype} report covers the last 30 days of performance data.",
                    recommendations=[f"Improve {rtype} strategy", f"Allocate more budget to {rtype}"],
                    format="pdf",
                    status="ready",
                    generated_by=admin_id,
                    is_automated=True,
                    schedule="monthly",
                ))
        print("  Created reports")

        # 12. Alerts
        alert_data = [
            ("ranking_drop", "critical", "Major Ranking Drop", "Keyword 'digital marketing tools' dropped from #3 to #12"),
            ("traffic_drop", "critical", "Significant Traffic Drop", "Organic traffic decreased by 35% compared to previous week"),
            ("backlink_loss", "warning", "High Authority Backlink Lost", "Backlink from forbes.com (DA 95) no longer active"),
            ("campaign_issue", "warning", "Campaign Budget Alert", "Google Ads campaign at 90% budget with 15 days remaining"),
            ("ranking_improvement", "info", "Keyword Milestone", "Keyword 'marketing automation' reached Top 10!"),
            ("traffic_drop", "warning", "Page Traffic Decline", "Blog post traffic decreased by 25% week-over-week"),
            ("campaign_issue", "critical", "Campaign ROAS Critical", "LinkedIn Ads ROAS dropped below 1.0x"),
            ("backlink_gain", "info", "New Quality Backlink", "New backlink from entrepreneur.com (DA 91) detected"),
        ]
        for cid in client_ids[:3]:
            for atype, sev, title, msg in alert_data:
                db.add(Alert(
                    id=uuid.uuid4(), client_id=cid,
                    alert_type=atype, severity=sev, title=title, message=msg,
                    data={}, is_read=random.choice([True, False]),
                    is_resolved=False, notification_sent=True,
                ))
        print("  Created alerts")

        # 13. Competitors
        competitor_data = [
            ("competitorone.com", "Competitor One"),
            ("rivalseo.com", "Rival SEO"),
            ("marketingleader.io", "Marketing Leader"),
        ]
        for cid in client_ids[:3]:
            for domain, name in competitor_data:
                comp_id = uuid.uuid4()
                db.add(Competitor(id=comp_id, client_id=cid, domain=domain, name=name, is_active=True))
                db.add(CompetitorAnalysis(
                    id=uuid.uuid4(), competitor_id=comp_id, client_id=cid,
                    analysis_type="seo",
                    domain_authority=random.randint(45, 75),
                    organic_traffic=random.randint(20000, 80000),
                    organic_keywords=random.randint(500, 2500),
                    backlinks_count=random.randint(3000, 16000),
                    referring_domains=random.randint(200, 1200),
                    top_keywords=[{"keyword": "marketing tool", "position": random.randint(1, 10)}, {"keyword": "seo platform", "position": random.randint(1, 15)}],
                    content_gap={"gaps": random.randint(5, 20), "topics": ["AI marketing", "automation"]},
                    backlink_gap={"domains": random.randint(20, 100), "opportunities": ["techcrunch.com", "wired.com"]},
                    strengths=["Strong brand recognition", "Large content library"],
                    weaknesses=["Slow page speed", "Limited social presence"],
                    recommendations=["Target their weak keywords", "Build links from their referring domains"],
                ))
        print("  Created competitors")

        # 14. Generated Images
        image_types = [
            ("instagram", 1080, 1080, "Modern tech company social post", "social_media"),
            ("facebook_ad", 1200, 628, "Summer sale ad with vibrant colors", "advertising"),
            ("linkedin_banner", 1584, 396, "Professional SaaS company banner", "social_media"),
            ("blog_thumbnail", 1200, 630, "SEO guide blog thumbnail", "blog"),
            ("youtube_thumbnail", 1280, 720, "AI marketing tools video thumbnail", "video"),
            ("website_banner", 1920, 600, "Website hero with abstract patterns", "website"),
        ]
        for cid in client_ids[:3]:
            for itype, w, h, prompt, usage in image_types:
                db.add(GeneratedImage(
                    id=uuid.uuid4(), client_id=cid,
                    prompt=prompt,
                    image_url=f"/generated/{uuid.uuid4()}.png",
                    width=w, height=h,
                    format="png",
                    style=random.choice(["photorealistic", "illustration", "minimal", "corporate"]),
                    model_used="dall-e-3",
                    usage_type=usage,
                    tags=[itype, "marketing", "brand"],
                    is_public=False,
                    generated_by=admin_id,
                ))
        print("  Created generated images")

        await db.commit()
        print("\nDatabase seeded successfully!")
        print(f"  Admin login: admin@marketingos.com / admin123")
        print(f"  Clients: {len(clients_data)}")
        print(f"  Total records created: ~500+")


if __name__ == "__main__":
    asyncio.run(seed())
