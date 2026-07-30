"""
Cross-engine data aggregation for the Marketing Brain.

Pulls real, already-persisted numbers from every engine (SEO, keywords,
backlinks, content, campaigns, ads, social, competitors, alerts) into one
flat snapshot dict. This is the only input the Marketing Brain's AI prompt
is built from — no fabricated numbers, only what other engines have already
computed or the user has entered.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from models.client import Client
from services import crud


async def gather_client_snapshot(db: AsyncSession, client: Client) -> dict:
    client_id = str(client.id)

    dashboard = await crud.get_client_dashboard_stats(db, client_id)
    backlink_profile = await crud.get_backlink_profile(db, client_id)
    competitors = await crud.list_competitors(db, client_id)
    campaigns, total_campaigns = await crud.list_campaigns(db, client_id=client_id, limit=100)
    content_pieces, total_content = await crud.list_content(db, client_id, limit=100)
    social_accounts = await crud.list_social_accounts(db, client_id)
    ad_accounts = await crud.list_ad_accounts(db, client_id)
    ad_campaigns = await crud.list_ad_campaigns(db, client_id)

    competitor_summaries = []
    for comp in competitors:
        analysis = await crud.get_competitor_analysis(db, client_id, str(comp.id))
        competitor_summaries.append({
            "name": comp.name,
            "domain": comp.domain,
            "domain_authority": analysis.domain_authority if analysis else None,
            "organic_traffic": analysis.organic_traffic if analysis else None,
        })

    total_ad_spend = 0.0
    total_ad_conversions = 0
    total_ad_revenue = 0.0
    for ad_campaign in ad_campaigns:
        for m in await crud.get_ad_metrics(db, str(ad_campaign.id)):
            total_ad_spend += m.spend
            total_ad_conversions += m.conversions
            total_ad_revenue += m.revenue

    content_by_status: dict = {}
    for piece in content_pieces:
        content_by_status[piece.status] = content_by_status.get(piece.status, 0) + 1

    campaign_summaries = [
        {"name": c.name, "type": c.campaign_type, "status": c.status, "budget": c.budget}
        for c in campaigns
    ]

    return {
        "client": {
            "name": client.name,
            "domain": client.domain,
            "industry": client.industry,
            "marketing_goals": client.marketing_goals,
        },
        "seo": {
            "overall_score": dashboard["seo_score"],
            "domain_authority": dashboard["domain_authority"],
            "organic_traffic": dashboard["organic_traffic"],
            "total_keywords_tracked": dashboard["total_keywords"],
            "keywords_in_top_10": dashboard["keywords_in_top_10"],
        },
        "backlinks": {
            "total_backlinks": backlink_profile.total_backlinks if backlink_profile else 0,
            "referring_domains": backlink_profile.referring_domains if backlink_profile else 0,
            "spam_score": backlink_profile.spam_score if backlink_profile else 0,
        },
        "content": {
            "total_pieces": total_content,
            "by_status": content_by_status,
        },
        "campaigns": {
            "total": total_campaigns,
            "active": dashboard["active_campaigns"],
            "list": campaign_summaries,
        },
        "ads": {
            "connected_accounts": len(ad_accounts),
            "total_campaigns": len(ad_campaigns),
            "total_spend": round(total_ad_spend, 2),
            "total_conversions": total_ad_conversions,
            "total_revenue": round(total_ad_revenue, 2),
        },
        "social": {
            "connected_accounts": [
                {"platform": a.platform, "followers": a.followers_count} for a in social_accounts
            ],
            "total_followers": sum(a.followers_count or 0 for a in social_accounts),
        },
        "competitors": competitor_summaries,
        "unread_alerts": dashboard["unread_alerts"],
    }
