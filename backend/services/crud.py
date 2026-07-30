"""
Database CRUD Operations Service

All database queries for the MarketingOS platform.
Replaces mock/dummy data with real PostgreSQL/SQLite queries.
"""

import uuid
import logging
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy import select, func, desc, asc, and_, or_, delete, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.user import User
from models.agency import Agency
from models.client import Client
from models.seo import SEOAudit, SEOMetrics, TechnicalSEOIssue
from models.keyword import Keyword, KeywordGroup
from models.backlink import Backlink, BacklinkProfile
from models.content import Content
from models.campaign import Campaign, CampaignMetrics
from models.social_media import SocialAccount, SocialPost, ContentCalendar
from models.ads import AdAccount, AdCampaign, AdMetrics
from models.report import Report
from models.alert import Alert
from models.competitor import Competitor, CompetitorAnalysis
from models.image import GeneratedImage
from models.knowledge import KnowledgeDocument, KnowledgeChunk
from models.marketing_brain import MarketingStrategy
from core.security import get_password_hash, verify_password

logger = logging.getLogger(__name__)


# ─── USER CRUD ───

async def create_user(db: AsyncSession, email: str, password: str, full_name: str, role: str = "member", agency_id: str = None) -> User:
    user = User(
        id=uuid.uuid4(),
        email=email,
        hashed_password=get_password_hash(password),
        full_name=full_name,
        role=role,
        agency_id=agency_id,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user


async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def get_user_by_id(db: AsyncSession, user_id: str) -> Optional[User]:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def authenticate_user(db: AsyncSession, email: str, password: str) -> Optional[User]:
    user = await get_user_by_email(db, email)
    if user and verify_password(password, user.hashed_password):
        return user
    return None


async def update_user(db: AsyncSession, user_id: str, **kwargs) -> Optional[User]:
    user = await get_user_by_id(db, user_id)
    if user:
        for key, value in kwargs.items():
            if value is not None and hasattr(user, key):
                setattr(user, key, value)
        await db.flush()
        await db.refresh(user)
    return user


# ─── AGENCY CRUD ───

async def create_agency(db: AsyncSession, name: str, slug: str, **kwargs) -> Agency:
    agency = Agency(id=uuid.uuid4(), name=name, slug=slug, **kwargs)
    db.add(agency)
    await db.flush()
    await db.refresh(agency)
    return agency


async def get_agency(db: AsyncSession, agency_id: str) -> Optional[Agency]:
    result = await db.execute(select(Agency).where(Agency.id == agency_id))
    return result.scalar_one_or_none()


# ─── CLIENT CRUD ───

async def create_client(db: AsyncSession, agency_id: str, name: str, domain: str, **kwargs) -> Client:
    client = Client(id=uuid.uuid4(), agency_id=agency_id, name=name, domain=domain, **kwargs)
    db.add(client)
    await db.flush()
    await db.refresh(client)
    return client


async def get_client(db: AsyncSession, client_id: str) -> Optional[Client]:
    result = await db.execute(select(Client).where(Client.id == client_id))
    return result.scalar_one_or_none()


async def list_clients(
    db: AsyncSession,
    agency_id: str = None,
    status: str = None,
    industry: str = None,
    search: str = None,
    skip: int = 0,
    limit: int = 20,
) -> Tuple[List[Client], int]:
    query = select(Client)
    count_query = select(func.count(Client.id))

    if agency_id:
        query = query.where(Client.agency_id == agency_id)
        count_query = count_query.where(Client.agency_id == agency_id)
    if status:
        query = query.where(Client.status == status)
        count_query = count_query.where(Client.status == status)
    if industry:
        query = query.where(Client.industry == industry)
        count_query = count_query.where(Client.industry == industry)
    if search:
        search_filter = or_(
            Client.name.ilike(f"%{search}%"),
            Client.domain.ilike(f"%{search}%"),
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)

    total = (await db.execute(count_query)).scalar()
    query = query.order_by(desc(Client.created_at)).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all(), total


async def update_client(db: AsyncSession, client_id: str, **kwargs) -> Optional[Client]:
    client = await get_client(db, client_id)
    if client:
        for key, value in kwargs.items():
            if value is not None and hasattr(client, key):
                setattr(client, key, value)
        await db.flush()
        await db.refresh(client)
    return client


async def delete_client(db: AsyncSession, client_id: str) -> bool:
    client = await get_client(db, client_id)
    if not client:
        return False
    # Delete all related records first (cascade)
    from models.seo import SEOAudit, SEOMetrics, TechnicalSEOIssue
    from models.keyword import Keyword, KeywordGroup
    from models.backlink import Backlink, BacklinkProfile
    from models.content import Content
    from models.campaign import Campaign, CampaignMetrics
    from models.social_media import SocialAccount, SocialPost, ContentCalendar
    from models.ads import AdAccount, AdCampaign
    from models.report import Report
    from models.alert import Alert
    from models.competitor import Competitor, CompetitorAnalysis
    from models.image import GeneratedImage

    # Delete in order (children first)
    # SEO: issues -> audits, metrics
    audits = (await db.execute(select(SEOAudit).where(SEOAudit.client_id == client_id))).scalars().all()
    for a in audits:
        await db.execute(delete(TechnicalSEOIssue).where(TechnicalSEOIssue.audit_id == a.id))
    await db.execute(delete(SEOAudit).where(SEOAudit.client_id == client_id))
    await db.execute(delete(SEOMetrics).where(SEOMetrics.client_id == client_id))

    # Keywords
    await db.execute(delete(Keyword).where(Keyword.client_id == client_id))
    await db.execute(delete(KeywordGroup).where(KeywordGroup.client_id == client_id))

    # Backlinks -> profile
    profiles = (await db.execute(select(BacklinkProfile).where(BacklinkProfile.client_id == client_id))).scalars().all()
    for p in profiles:
        await db.execute(delete(Backlink).where(Backlink.profile_id == p.id))
    await db.execute(delete(BacklinkProfile).where(BacklinkProfile.client_id == client_id))

    # Content, Images
    await db.execute(delete(Content).where(Content.client_id == client_id))
    await db.execute(delete(GeneratedImage).where(GeneratedImage.client_id == client_id))

    # Campaigns -> metrics
    campaigns = (await db.execute(select(Campaign).where(Campaign.client_id == client_id))).scalars().all()
    for c in campaigns:
        await db.execute(delete(CampaignMetrics).where(CampaignMetrics.campaign_id == c.id))
    await db.execute(delete(Campaign).where(Campaign.client_id == client_id))

    # Social: posts -> accounts, calendar
    accounts = (await db.execute(select(SocialAccount).where(SocialAccount.client_id == client_id))).scalars().all()
    for a in accounts:
        await db.execute(delete(SocialPost).where(SocialPost.account_id == a.id))
    await db.execute(delete(SocialAccount).where(SocialAccount.client_id == client_id))
    await db.execute(delete(ContentCalendar).where(ContentCalendar.client_id == client_id))

    # Ads: campaigns -> accounts
    ad_accounts = (await db.execute(select(AdAccount).where(AdAccount.client_id == client_id))).scalars().all()
    for aa in ad_accounts:
        ad_camps = (await db.execute(select(AdCampaign).where(AdCampaign.ad_account_id == aa.id))).scalars().all()
        for ac in ad_camps:
            from models.ads import AdMetrics
            await db.execute(delete(AdMetrics).where(AdMetrics.ad_campaign_id == ac.id))
        await db.execute(delete(AdCampaign).where(AdCampaign.ad_account_id == aa.id))
    await db.execute(delete(AdAccount).where(AdAccount.client_id == client_id))

    # Reports, Alerts
    await db.execute(delete(Report).where(Report.client_id == client_id))
    await db.execute(delete(Alert).where(Alert.client_id == client_id))

    # Knowledge Brain: chunks -> documents
    await db.execute(delete(KnowledgeChunk).where(KnowledgeChunk.client_id == client_id))
    await db.execute(delete(KnowledgeDocument).where(KnowledgeDocument.client_id == client_id))

    # Marketing Brain
    await db.execute(delete(MarketingStrategy).where(MarketingStrategy.client_id == client_id))

    # Competitors -> analysis
    comps = (await db.execute(select(Competitor).where(Competitor.client_id == client_id))).scalars().all()
    for comp in comps:
        await db.execute(delete(CompetitorAnalysis).where(CompetitorAnalysis.competitor_id == comp.id))
    await db.execute(delete(Competitor).where(Competitor.client_id == client_id))

    # Finally delete the client
    await db.delete(client)
    await db.flush()
    return True


# ─── SEO CRUD ───

async def create_seo_audit(db: AsyncSession, client_id: str, **kwargs) -> SEOAudit:
    if "status" not in kwargs:
        kwargs["status"] = "running"
    audit = SEOAudit(id=uuid.uuid4(), client_id=client_id, **kwargs)
    db.add(audit)
    await db.flush()
    await db.refresh(audit)
    return audit


async def get_seo_audit(db: AsyncSession, audit_id: str) -> Optional[SEOAudit]:
    result = await db.execute(select(SEOAudit).where(SEOAudit.id == audit_id))
    return result.scalar_one_or_none()


async def list_seo_audits(db: AsyncSession, client_id: str, skip: int = 0, limit: int = 10) -> Tuple[List[SEOAudit], int]:
    query = select(SEOAudit).where(SEOAudit.client_id == client_id).order_by(desc(SEOAudit.created_at))
    count = (await db.execute(select(func.count(SEOAudit.id)).where(SEOAudit.client_id == client_id))).scalar()
    result = await db.execute(query.offset(skip).limit(limit))
    return result.scalars().all(), count


async def update_seo_audit(db: AsyncSession, audit_id: str, **kwargs) -> Optional[SEOAudit]:
    audit = await get_seo_audit(db, audit_id)
    if audit:
        for key, value in kwargs.items():
            if value is not None and hasattr(audit, key):
                setattr(audit, key, value)
        await db.flush()
        await db.refresh(audit)
    return audit


async def create_seo_metrics(db: AsyncSession, client_id: str, **kwargs) -> SEOMetrics:
    metrics = SEOMetrics(id=uuid.uuid4(), client_id=client_id, date=datetime.now(timezone.utc).date(), **kwargs)
    db.add(metrics)
    await db.flush()
    await db.refresh(metrics)
    return metrics


async def get_seo_metrics(db: AsyncSession, client_id: str, date_from: str = None, date_to: str = None) -> List[SEOMetrics]:
    query = select(SEOMetrics).where(SEOMetrics.client_id == client_id).order_by(desc(SEOMetrics.date))
    if date_from:
        query = query.where(SEOMetrics.date >= date_from)
    if date_to:
        query = query.where(SEOMetrics.date <= date_to)
    result = await db.execute(query.limit(365))
    return result.scalars().all()


async def get_technical_issues(db: AsyncSession, audit_id: str = None, client_id: str = None, severity: str = None, category: str = None) -> List[TechnicalSEOIssue]:
    query = select(TechnicalSEOIssue)
    if audit_id:
        query = query.where(TechnicalSEOIssue.audit_id == audit_id)
    if severity:
        query = query.where(TechnicalSEOIssue.severity == severity)
    if category:
        query = query.where(TechnicalSEOIssue.category == category)
    result = await db.execute(query)
    return result.scalars().all()


# ─── KEYWORD CRUD ───

async def add_keywords(db: AsyncSession, client_id: str, keywords: List[str]) -> List[Keyword]:
    added = []
    for kw in keywords:
        existing = await db.execute(select(Keyword).where(and_(Keyword.client_id == client_id, Keyword.keyword == kw)))
        if not existing.scalar_one_or_none():
            keyword = Keyword(id=uuid.uuid4(), client_id=client_id, keyword=kw)
            db.add(keyword)
            added.append(keyword)
    await db.flush()
    return added


async def list_keywords(
    db: AsyncSession,
    client_id: str,
    search: str = None,
    min_volume: int = None,
    max_difficulty: int = None,
    sort_by: str = "current_position",
    sort_order: str = "asc",
    skip: int = 0,
    limit: int = 20,
) -> Tuple[List[Keyword], int]:
    query = select(Keyword).where(Keyword.client_id == client_id)
    count_query = select(func.count(Keyword.id)).where(Keyword.client_id == client_id)

    if search:
        query = query.where(Keyword.keyword.ilike(f"%{search}%"))
        count_query = count_query.where(Keyword.keyword.ilike(f"%{search}%"))
    if min_volume:
        query = query.where(Keyword.search_volume >= min_volume)
        count_query = count_query.where(Keyword.search_volume >= min_volume)
    if max_difficulty:
        query = query.where(Keyword.difficulty <= max_difficulty)
        count_query = count_query.where(Keyword.difficulty <= max_difficulty)

    # Sort
    sort_col = getattr(Keyword, sort_by, Keyword.current_position)
    order_func = asc if sort_order == "asc" else desc
    query = query.order_by(order_func(sort_col))

    total = (await db.execute(count_query)).scalar()
    result = await db.execute(query.offset(skip).limit(limit))
    return result.scalars().all(), total


async def delete_keyword(db: AsyncSession, client_id: str, keyword_id: str) -> bool:
    result = await db.execute(
        delete(Keyword).where(and_(Keyword.id == keyword_id, Keyword.client_id == client_id))
    )
    await db.flush()
    return result.rowcount > 0


async def get_keyword_groups(db: AsyncSession, client_id: str) -> List[KeywordGroup]:
    result = await db.execute(select(KeywordGroup).where(KeywordGroup.client_id == client_id))
    return result.scalars().all()


# ─── BACKLINK CRUD ───

async def list_backlinks(
    db: AsyncSession,
    client_id: str,
    status: str = None,
    rel_type: str = None,
    min_da: int = None,
    search: str = None,
    skip: int = 0,
    limit: int = 20,
) -> Tuple[List[Backlink], int]:
    # Backlinks link to client via profile_id -> BacklinkProfile.client_id
    profile = await get_backlink_profile(db, client_id)
    if not profile:
        return [], 0

    query = select(Backlink).where(Backlink.profile_id == profile.id)
    count_query = select(func.count(Backlink.id)).where(Backlink.profile_id == profile.id)

    if status:
        is_active = status == "active"
        query = query.where(Backlink.is_active == is_active)
        count_query = count_query.where(Backlink.is_active == is_active)
    if rel_type:
        query = query.where(Backlink.rel_type == rel_type)
        count_query = count_query.where(Backlink.rel_type == rel_type)
    if min_da:
        query = query.where(Backlink.domain_authority >= min_da)
        count_query = count_query.where(Backlink.domain_authority >= min_da)
    if search:
        sf = or_(Backlink.source_url.ilike(f"%{search}%"), Backlink.anchor_text.ilike(f"%{search}%"))
        query = query.where(sf)
        count_query = count_query.where(sf)

    total = (await db.execute(count_query)).scalar()
    result = await db.execute(query.order_by(desc(Backlink.first_seen)).offset(skip).limit(limit))
    return result.scalars().all(), total


async def get_backlink_profile(db: AsyncSession, client_id: str) -> Optional[BacklinkProfile]:
    result = await db.execute(select(BacklinkProfile).where(BacklinkProfile.client_id == client_id))
    return result.scalar_one_or_none()


# ─── CONTENT CRUD ───

async def create_content(db: AsyncSession, client_id: str, **kwargs) -> Content:
    content = Content(id=uuid.uuid4(), client_id=client_id, **kwargs)
    db.add(content)
    await db.flush()
    await db.refresh(content)
    return content


async def get_content(db: AsyncSession, client_id: str, content_id: str) -> Optional[Content]:
    result = await db.execute(
        select(Content).where(and_(Content.id == content_id, Content.client_id == client_id))
    )
    return result.scalar_one_or_none()


async def list_content(
    db: AsyncSession,
    client_id: str,
    content_type: str = None,
    status: str = None,
    skip: int = 0,
    limit: int = 20,
) -> Tuple[List[Content], int]:
    query = select(Content).where(Content.client_id == client_id)
    count_query = select(func.count(Content.id)).where(Content.client_id == client_id)

    if content_type:
        query = query.where(Content.content_type == content_type)
        count_query = count_query.where(Content.content_type == content_type)
    if status:
        query = query.where(Content.status == status)
        count_query = count_query.where(Content.status == status)

    total = (await db.execute(count_query)).scalar()
    result = await db.execute(query.order_by(desc(Content.created_at)).offset(skip).limit(limit))
    return result.scalars().all(), total


async def update_content(db: AsyncSession, client_id: str, content_id: str, **kwargs) -> Optional[Content]:
    content = await get_content(db, client_id, content_id)
    if content:
        for key, value in kwargs.items():
            if value is not None and hasattr(content, key):
                setattr(content, key, value)
        await db.flush()
        await db.refresh(content)
    return content


async def delete_content(db: AsyncSession, client_id: str, content_id: str) -> bool:
    result = await db.execute(
        delete(Content).where(and_(Content.id == content_id, Content.client_id == client_id))
    )
    await db.flush()
    return result.rowcount > 0


# ─── CAMPAIGN CRUD ───

async def create_campaign(db: AsyncSession, client_id: str, **kwargs) -> Campaign:
    campaign = Campaign(id=uuid.uuid4(), client_id=client_id, status="draft", **kwargs)
    db.add(campaign)
    await db.flush()
    await db.refresh(campaign)
    return campaign


async def get_campaign(db: AsyncSession, campaign_id: str) -> Optional[Campaign]:
    result = await db.execute(select(Campaign).where(Campaign.id == campaign_id))
    return result.scalar_one_or_none()


async def list_campaigns(
    db: AsyncSession,
    agency_id: str = None,
    client_id: str = None,
    campaign_type: str = None,
    status: str = None,
    skip: int = 0,
    limit: int = 20,
) -> Tuple[List[Campaign], int]:
    query = select(Campaign)
    count_query = select(func.count(Campaign.id))

    if agency_id:
        query = query.join(Client, Campaign.client_id == Client.id).where(Client.agency_id == agency_id)
        count_query = count_query.join(Client, Campaign.client_id == Client.id).where(Client.agency_id == agency_id)
    if client_id:
        query = query.where(Campaign.client_id == client_id)
        count_query = count_query.where(Campaign.client_id == client_id)
    if campaign_type:
        query = query.where(Campaign.campaign_type == campaign_type)
        count_query = count_query.where(Campaign.campaign_type == campaign_type)
    if status:
        query = query.where(Campaign.status == status)
        count_query = count_query.where(Campaign.status == status)

    total = (await db.execute(count_query)).scalar()
    result = await db.execute(query.order_by(desc(Campaign.created_at)).offset(skip).limit(limit))
    return result.scalars().all(), total


async def update_campaign(db: AsyncSession, campaign_id: str, **kwargs) -> Optional[Campaign]:
    campaign = await get_campaign(db, campaign_id)
    if campaign:
        for key, value in kwargs.items():
            if value is not None and hasattr(campaign, key):
                setattr(campaign, key, value)
        await db.flush()
        await db.refresh(campaign)
    return campaign


async def delete_campaign(db: AsyncSession, campaign_id: str) -> bool:
    result = await db.execute(delete(Campaign).where(Campaign.id == campaign_id))
    await db.flush()
    return result.rowcount > 0


async def get_campaign_metrics(db: AsyncSession, campaign_id: str) -> List[CampaignMetrics]:
    result = await db.execute(
        select(CampaignMetrics).where(CampaignMetrics.campaign_id == campaign_id).order_by(desc(CampaignMetrics.date))
    )
    return result.scalars().all()


# ─── SOCIAL MEDIA CRUD ───

async def list_social_accounts(db: AsyncSession, client_id: str) -> List[SocialAccount]:
    result = await db.execute(select(SocialAccount).where(SocialAccount.client_id == client_id))
    return result.scalars().all()


async def create_social_account(db: AsyncSession, client_id: str, **kwargs) -> SocialAccount:
    account = SocialAccount(id=uuid.uuid4(), client_id=client_id, is_connected=True, **kwargs)
    db.add(account)
    await db.flush()
    await db.refresh(account)
    return account


async def list_social_posts(
    db: AsyncSession,
    client_id: str,
    platform: str = None,
    status: str = None,
    skip: int = 0,
    limit: int = 20,
) -> Tuple[List[SocialPost], int]:
    # SocialPost links via account_id, join through SocialAccount
    accounts = await list_social_accounts(db, client_id)
    account_ids = [a.id for a in accounts]
    if not account_ids:
        return [], 0

    query = select(SocialPost).where(SocialPost.account_id.in_(account_ids))
    count_query = select(func.count(SocialPost.id)).where(SocialPost.account_id.in_(account_ids))

    if platform:
        # Filter by platform through account relationship
        platform_accounts = [a.id for a in accounts if a.platform == platform]
        if platform_accounts:
            query = query.where(SocialPost.account_id.in_(platform_accounts))
            count_query = count_query.where(SocialPost.account_id.in_(platform_accounts))
        else:
            return [], 0
    if status:
        query = query.where(SocialPost.status == status)
        count_query = count_query.where(SocialPost.status == status)

    total = (await db.execute(count_query)).scalar()
    result = await db.execute(query.order_by(desc(SocialPost.created_at)).offset(skip).limit(limit))
    return result.scalars().all(), total


async def create_social_post(db: AsyncSession, client_id: str, **kwargs) -> SocialPost:
    # SocialPost links via account_id, so find/create account first
    platform = kwargs.pop("platform", "instagram")
    accounts = await list_social_accounts(db, client_id)
    account = next((a for a in accounts if a.platform == platform), None)
    if not account:
        account = await create_social_account(db, client_id, platform=platform, account_name=f"@{platform}_account")
    post = SocialPost(id=uuid.uuid4(), account_id=account.id, **kwargs)
    db.add(post)
    await db.flush()
    await db.refresh(post)
    return post


async def _get_owned_social_post(db: AsyncSession, client_id: str, post_id: str) -> Optional[SocialPost]:
    result = await db.execute(
        select(SocialPost)
        .join(SocialAccount, SocialPost.account_id == SocialAccount.id)
        .where(and_(SocialPost.id == post_id, SocialAccount.client_id == client_id))
    )
    return result.scalar_one_or_none()


async def update_social_post(db: AsyncSession, client_id: str, post_id: str, **kwargs) -> Optional[SocialPost]:
    post = await _get_owned_social_post(db, client_id, post_id)
    if post:
        for key, value in kwargs.items():
            if value is not None and hasattr(post, key):
                setattr(post, key, value)
        await db.flush()
        await db.refresh(post)
    return post


async def delete_social_post(db: AsyncSession, client_id: str, post_id: str) -> bool:
    post = await _get_owned_social_post(db, client_id, post_id)
    if not post:
        return False
    await db.delete(post)
    await db.flush()
    return True


# ─── ADS CRUD ───

async def list_ad_accounts(db: AsyncSession, client_id: str) -> List[AdAccount]:
    result = await db.execute(select(AdAccount).where(AdAccount.client_id == client_id))
    return result.scalars().all()


async def create_ad_account(db: AsyncSession, client_id: str, **kwargs) -> AdAccount:
    account = AdAccount(id=uuid.uuid4(), client_id=client_id, is_connected=True, **kwargs)
    db.add(account)
    await db.flush()
    await db.refresh(account)
    return account


async def list_ad_campaigns(
    db: AsyncSession,
    client_id: str,
    platform: str = None,
    status: str = None,
) -> List[AdCampaign]:
    # AdCampaign links via ad_account_id, join through AdAccount
    accounts = await list_ad_accounts(db, client_id)
    account_ids = [a.id for a in accounts]
    if not account_ids:
        return []

    query = select(AdCampaign).where(AdCampaign.ad_account_id.in_(account_ids))
    if status:
        query = query.where(AdCampaign.status == status)
    result = await db.execute(query.order_by(desc(AdCampaign.start_date)))
    return result.scalars().all()


async def create_ad_campaign(db: AsyncSession, client_id: str, **kwargs) -> AdCampaign:
    # AdCampaign requires ad_account_id, find or create account
    platform = kwargs.pop("platform", "google")
    accounts = await list_ad_accounts(db, client_id)
    account = next((a for a in accounts if a.platform == platform), None)
    if not account:
        account = await create_ad_account(db, client_id, platform=platform)
    campaign = AdCampaign(id=uuid.uuid4(), ad_account_id=account.id, status="draft", **kwargs)
    db.add(campaign)
    await db.flush()
    await db.refresh(campaign)
    return campaign


async def get_ad_metrics(db: AsyncSession, ad_campaign_id: str) -> List[AdMetrics]:
    result = await db.execute(
        select(AdMetrics).where(AdMetrics.ad_campaign_id == ad_campaign_id).order_by(desc(AdMetrics.date))
    )
    return result.scalars().all()


# ─── REPORT CRUD ───

async def create_report(db: AsyncSession, client_id: str, **kwargs) -> Report:
    report = Report(id=uuid.uuid4(), client_id=client_id, status="generating", **kwargs)
    db.add(report)
    await db.flush()
    await db.refresh(report)
    return report


async def get_report(db: AsyncSession, client_id: str, report_id: str) -> Optional[Report]:
    result = await db.execute(
        select(Report).where(and_(Report.id == report_id, Report.client_id == client_id))
    )
    return result.scalar_one_or_none()


async def list_reports(
    db: AsyncSession,
    client_id: str,
    report_type: str = None,
    skip: int = 0,
    limit: int = 20,
) -> Tuple[List[Report], int]:
    query = select(Report).where(Report.client_id == client_id)
    count_query = select(func.count(Report.id)).where(Report.client_id == client_id)

    if report_type:
        query = query.where(Report.report_type == report_type)
        count_query = count_query.where(Report.report_type == report_type)

    total = (await db.execute(count_query)).scalar()
    result = await db.execute(query.order_by(desc(Report.created_at)).offset(skip).limit(limit))
    return result.scalars().all(), total


# ─── ALERT CRUD ───

async def create_alert(db: AsyncSession, client_id: str, **kwargs) -> Alert:
    alert = Alert(id=uuid.uuid4(), client_id=client_id, is_read=False, **kwargs)
    db.add(alert)
    await db.flush()
    await db.refresh(alert)
    return alert


async def list_alerts(
    db: AsyncSession,
    client_id: str,
    alert_type: str = None,
    severity: str = None,
    is_read: bool = None,
    skip: int = 0,
    limit: int = 20,
) -> Tuple[List[Alert], int]:
    query = select(Alert).where(Alert.client_id == client_id)
    count_query = select(func.count(Alert.id)).where(Alert.client_id == client_id)

    if alert_type:
        query = query.where(Alert.alert_type == alert_type)
        count_query = count_query.where(Alert.alert_type == alert_type)
    if severity:
        query = query.where(Alert.severity == severity)
        count_query = count_query.where(Alert.severity == severity)
    if is_read is not None:
        query = query.where(Alert.is_read == is_read)
        count_query = count_query.where(Alert.is_read == is_read)

    total = (await db.execute(count_query)).scalar()
    result = await db.execute(query.order_by(desc(Alert.created_at)).offset(skip).limit(limit))
    return result.scalars().all(), total


async def mark_alert_read(db: AsyncSession, client_id: str, alert_id: str) -> bool:
    result = await db.execute(
        update(Alert).where(and_(Alert.id == alert_id, Alert.client_id == client_id)).values(is_read=True)
    )
    await db.flush()
    return result.rowcount > 0


async def mark_all_alerts_read(db: AsyncSession, client_id: str) -> int:
    result = await db.execute(
        update(Alert).where(and_(Alert.client_id == client_id, Alert.is_read == False)).values(is_read=True)
    )
    await db.flush()
    return result.rowcount


# ─── COMPETITOR CRUD ───

async def add_competitor(db: AsyncSession, client_id: str, domain: str, name: str) -> Competitor:
    comp = Competitor(id=uuid.uuid4(), client_id=client_id, domain=domain, name=name)
    db.add(comp)
    await db.flush()
    await db.refresh(comp)
    return comp


async def list_competitors(db: AsyncSession, client_id: str) -> List[Competitor]:
    result = await db.execute(select(Competitor).where(Competitor.client_id == client_id))
    return result.scalars().all()


async def delete_competitor(db: AsyncSession, client_id: str, competitor_id: str) -> bool:
    result = await db.execute(
        delete(Competitor).where(and_(Competitor.id == competitor_id, Competitor.client_id == client_id))
    )
    await db.flush()
    return result.rowcount > 0


async def get_competitor_analysis(db: AsyncSession, client_id: str, competitor_id: str) -> Optional[CompetitorAnalysis]:
    result = await db.execute(
        select(CompetitorAnalysis)
        .where(and_(CompetitorAnalysis.competitor_id == competitor_id, CompetitorAnalysis.client_id == client_id))
        .order_by(desc(CompetitorAnalysis.created_at)).limit(1)
    )
    return result.scalar_one_or_none()


# ─── IMAGE CRUD ───

async def create_generated_image(db: AsyncSession, client_id: str, **kwargs) -> GeneratedImage:
    image = GeneratedImage(id=uuid.uuid4(), client_id=client_id, **kwargs)
    db.add(image)
    await db.flush()
    await db.refresh(image)
    return image


async def list_generated_images(
    db: AsyncSession,
    client_id: str,
    image_type: str = None,
    skip: int = 0,
    limit: int = 20,
) -> Tuple[List[GeneratedImage], int]:
    query = select(GeneratedImage).where(GeneratedImage.client_id == client_id)
    count_query = select(func.count(GeneratedImage.id)).where(GeneratedImage.client_id == client_id)

    if image_type:
        query = query.where(GeneratedImage.image_type == image_type)
        count_query = count_query.where(GeneratedImage.image_type == image_type)

    total = (await db.execute(count_query)).scalar()
    result = await db.execute(query.order_by(desc(GeneratedImage.created_at)).offset(skip).limit(limit))
    return result.scalars().all(), total


async def delete_generated_image(db: AsyncSession, client_id: str, image_id: str) -> bool:
    result = await db.execute(
        delete(GeneratedImage).where(and_(GeneratedImage.id == image_id, GeneratedImage.client_id == client_id))
    )
    await db.flush()
    return result.rowcount > 0


# ─── KNOWLEDGE BRAIN CRUD ───

async def create_knowledge_document(
    db: AsyncSession, client_id: str, title: str, content: str, source_type: str = "text"
) -> KnowledgeDocument:
    document = KnowledgeDocument(
        id=uuid.uuid4(), client_id=client_id, title=title, content=content, source_type=source_type,
    )
    db.add(document)
    await db.flush()
    await db.refresh(document)
    return document


async def list_knowledge_documents(
    db: AsyncSession, client_id: str, skip: int = 0, limit: int = 20
) -> Tuple[List[KnowledgeDocument], int]:
    query = select(KnowledgeDocument).where(KnowledgeDocument.client_id == client_id)
    count_query = select(func.count(KnowledgeDocument.id)).where(KnowledgeDocument.client_id == client_id)
    total = (await db.execute(count_query)).scalar()
    result = await db.execute(query.order_by(desc(KnowledgeDocument.created_at)).offset(skip).limit(limit))
    return result.scalars().all(), total


async def get_knowledge_document(db: AsyncSession, client_id: str, document_id: str) -> Optional[KnowledgeDocument]:
    result = await db.execute(
        select(KnowledgeDocument).where(
            and_(KnowledgeDocument.id == document_id, KnowledgeDocument.client_id == client_id)
        )
    )
    return result.scalar_one_or_none()


async def delete_knowledge_document(db: AsyncSession, client_id: str, document_id: str) -> bool:
    await db.execute(
        delete(KnowledgeChunk).where(
            and_(KnowledgeChunk.document_id == document_id, KnowledgeChunk.client_id == client_id)
        )
    )
    result = await db.execute(
        delete(KnowledgeDocument).where(
            and_(KnowledgeDocument.id == document_id, KnowledgeDocument.client_id == client_id)
        )
    )
    await db.flush()
    return result.rowcount > 0


async def create_knowledge_chunks(
    db: AsyncSession,
    document_id: str,
    client_id: str,
    chunks: List[str],
    embeddings: List[Optional[List[float]]],
    embedding_provider: Optional[str] = None,
) -> List[KnowledgeChunk]:
    created = []
    for i, (text, embedding) in enumerate(zip(chunks, embeddings)):
        chunk = KnowledgeChunk(
            id=uuid.uuid4(),
            document_id=document_id,
            client_id=client_id,
            chunk_index=i,
            content=text,
            embedding=embedding,
            embedding_provider=embedding_provider,
        )
        db.add(chunk)
        created.append(chunk)
    await db.flush()
    return created


async def list_knowledge_chunks(db: AsyncSession, client_id: str) -> List[KnowledgeChunk]:
    result = await db.execute(select(KnowledgeChunk).where(KnowledgeChunk.client_id == client_id))
    return result.scalars().all()


# ─── MARKETING BRAIN CRUD ───

async def create_marketing_strategy(db: AsyncSession, client_id: str, **kwargs) -> MarketingStrategy:
    strategy = MarketingStrategy(id=uuid.uuid4(), client_id=client_id, **kwargs)
    db.add(strategy)
    await db.flush()
    await db.refresh(strategy)
    return strategy


async def get_marketing_strategy(db: AsyncSession, client_id: str, strategy_id: str) -> Optional[MarketingStrategy]:
    result = await db.execute(
        select(MarketingStrategy).where(
            and_(MarketingStrategy.id == strategy_id, MarketingStrategy.client_id == client_id)
        )
    )
    return result.scalar_one_or_none()


async def list_marketing_strategies(
    db: AsyncSession, client_id: str, skip: int = 0, limit: int = 20
) -> Tuple[List[MarketingStrategy], int]:
    query = select(MarketingStrategy).where(MarketingStrategy.client_id == client_id)
    count_query = select(func.count(MarketingStrategy.id)).where(MarketingStrategy.client_id == client_id)
    total = (await db.execute(count_query)).scalar()
    result = await db.execute(query.order_by(desc(MarketingStrategy.created_at)).offset(skip).limit(limit))
    return result.scalars().all(), total


async def get_latest_marketing_strategy(db: AsyncSession, client_id: str) -> Optional[MarketingStrategy]:
    result = await db.execute(
        select(MarketingStrategy)
        .where(MarketingStrategy.client_id == client_id)
        .order_by(desc(MarketingStrategy.created_at))
        .limit(1)
    )
    return result.scalar_one_or_none()


# ─── DASHBOARD STATS ───

async def get_client_dashboard_stats(db: AsyncSession, client_id: str) -> dict:
    """Get aggregated dashboard statistics for a client."""
    keywords_total = (await db.execute(select(func.count(Keyword.id)).where(Keyword.client_id == client_id))).scalar() or 0
    keywords_top10 = (await db.execute(select(func.count(Keyword.id)).where(and_(Keyword.client_id == client_id, Keyword.current_position <= 10)))).scalar() or 0
    # Backlinks link via BacklinkProfile, so join through profile
    profile = await get_backlink_profile(db, client_id)
    backlinks_total = 0
    if profile:
        backlinks_total = (await db.execute(select(func.count(Backlink.id)).where(Backlink.profile_id == profile.id))).scalar() or 0
    content_total = (await db.execute(select(func.count(Content.id)).where(Content.client_id == client_id))).scalar() or 0
    campaigns_active = (await db.execute(select(func.count(Campaign.id)).where(and_(Campaign.client_id == client_id, Campaign.status == "active")))).scalar() or 0
    alerts_unread = (await db.execute(select(func.count(Alert.id)).where(and_(Alert.client_id == client_id, Alert.is_read == False)))).scalar() or 0

    # Get latest SEO audit score
    latest_audit = (await db.execute(
        select(SEOAudit).where(SEOAudit.client_id == client_id).order_by(desc(SEOAudit.created_at)).limit(1)
    )).scalar_one_or_none()

    # Get latest metrics
    latest_metrics = (await db.execute(
        select(SEOMetrics).where(SEOMetrics.client_id == client_id).order_by(desc(SEOMetrics.date)).limit(1)
    )).scalar_one_or_none()

    return {
        "client_id": str(client_id),
        "seo_score": latest_audit.overall_score if latest_audit else 0,
        "domain_authority": latest_metrics.domain_authority if latest_metrics else 0,
        "organic_traffic": latest_metrics.organic_traffic if latest_metrics else 0,
        "total_keywords": keywords_total,
        "keywords_in_top_10": keywords_top10,
        "total_backlinks": backlinks_total,
        "total_content": content_total,
        "active_campaigns": campaigns_active,
        "unread_alerts": alerts_unread,
    }
