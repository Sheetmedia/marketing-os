from .user import UserBase, UserCreate, UserLogin, UserResponse, Token
from .client import ClientBase, ClientCreate, ClientUpdate, ClientResponse
from .seo import SEOAuditRequest, SEOAuditResponse, SEOMetricsResponse, TechnicalIssueResponse
from .keyword import (
    KeywordCreate,
    KeywordResponse,
    KeywordGroupCreate,
    KeywordGroupResponse,
    KeywordResearchRequest,
)
from .backlink import BacklinkResponse, BacklinkProfileResponse
from .content import (
    ContentGenerateRequest,
    ContentResponse,
    ContentUpdateRequest,
    ContentOptimizeRequest,
)
from .image import ImageGenerateRequest, ImageResponse
from .social_media import (
    SocialAccountCreate,
    SocialAccountResponse,
    SocialPostCreate,
    SocialPostResponse,
    ContentCalendarResponse,
)
from .ads import (
    AdAccountCreate,
    AdAccountResponse,
    AdCampaignCreate,
    AdCampaignResponse,
    AdAnalyticsResponse,
)
from .campaign import CampaignCreate, CampaignUpdate, CampaignResponse, CampaignMetricsResponse
from .report import ReportGenerateRequest, ReportResponse
from .alert import AlertResponse, AlertSettingsUpdate
from .competitor import (
    CompetitorCreate,
    CompetitorResponse,
    CompetitorAnalysisResponse,
    GapReportResponse,
)
from .ai_assistant import ChatRequest, ChatResponse, AnalyzeRequest, RecommendationResponse

__all__ = [
    # User
    "UserBase",
    "UserCreate",
    "UserLogin",
    "UserResponse",
    "Token",
    # Client
    "ClientBase",
    "ClientCreate",
    "ClientUpdate",
    "ClientResponse",
    # SEO
    "SEOAuditRequest",
    "SEOAuditResponse",
    "SEOMetricsResponse",
    "TechnicalIssueResponse",
    # Keyword
    "KeywordCreate",
    "KeywordResponse",
    "KeywordGroupCreate",
    "KeywordGroupResponse",
    "KeywordResearchRequest",
    # Backlink
    "BacklinkResponse",
    "BacklinkProfileResponse",
    # Content
    "ContentGenerateRequest",
    "ContentResponse",
    "ContentUpdateRequest",
    "ContentOptimizeRequest",
    # Image
    "ImageGenerateRequest",
    "ImageResponse",
    # Social Media
    "SocialAccountCreate",
    "SocialAccountResponse",
    "SocialPostCreate",
    "SocialPostResponse",
    "ContentCalendarResponse",
    # Ads
    "AdAccountCreate",
    "AdAccountResponse",
    "AdCampaignCreate",
    "AdCampaignResponse",
    "AdAnalyticsResponse",
    # Campaign
    "CampaignCreate",
    "CampaignUpdate",
    "CampaignResponse",
    "CampaignMetricsResponse",
    # Report
    "ReportGenerateRequest",
    "ReportResponse",
    # Alert
    "AlertResponse",
    "AlertSettingsUpdate",
    # Competitor
    "CompetitorCreate",
    "CompetitorResponse",
    "CompetitorAnalysisResponse",
    "GapReportResponse",
    # AI Assistant
    "ChatRequest",
    "ChatResponse",
    "AnalyzeRequest",
    "RecommendationResponse",
]
