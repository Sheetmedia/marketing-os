from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "MarketingOS"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@db:5432/marketing_os"

    # Redis
    REDIS_URL: str = "redis://redis:6379/0"

    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # Comma-separated list of allowed frontend origins (no trailing slash)
    CORS_ORIGINS: str = "http://localhost:3030,http://127.0.0.1:3030"

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    # OpenAI
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o"

    # Anthropic
    ANTHROPIC_API_KEY: str = ""
    ANTHROPIC_MODEL: str = "claude-sonnet-5"

    # Google Gemini
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.0-flash"

    # Groq
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"

    # AI Gateway — comma-separated provider fallback order
    AI_PROVIDER_PRIORITY: str = "openai,anthropic,gemini,groq"

    # Stable Diffusion
    STABLE_DIFFUSION_API_URL: str = "http://stable-diffusion:7860"

    # Google PageSpeed Insights — used by SEOCrawlerService for real
    # Core Web Vitals / performance / accessibility / SEO scores. Free to
    # obtain from Google Cloud Console; without it, PSI's shared quota is
    # exhausted almost immediately (HTTP 429) and those fields come back
    # as unavailable rather than fabricated.
    PAGESPEED_API_KEY: str = ""

    # Third-party backlink data provider (e.g. Ahrefs/Moz/Majestic/DataForSEO).
    # Without a key, BacklinkMonitorService honestly returns an empty profile
    # rather than fabricating numbers.
    BACKLINK_API_KEY: str = ""

    # Google Search Console OAuth — free, real traffic/ranking data for a
    # client's own verified site. Create credentials at
    # https://console.cloud.google.com/apis/credentials (OAuth client ID,
    # type "Web application") and enable the "Search Console API".
    GOOGLE_OAUTH_CLIENT_ID: str = ""
    GOOGLE_OAUTH_CLIENT_SECRET: str = ""
    GOOGLE_OAUTH_REDIRECT_URI: str = "http://localhost:3031/api/v1/integrations/google/callback"
    FRONTEND_URL: str = "http://localhost:3030"

    # Google Ads
    GOOGLE_ADS_CLIENT_ID: Optional[str] = None
    GOOGLE_ADS_CLIENT_SECRET: Optional[str] = None

    # Facebook Ads
    FACEBOOK_ADS_ACCESS_TOKEN: Optional[str] = None

    # LinkedIn Ads
    LINKEDIN_ADS_ACCESS_TOKEN: Optional[str] = None

    model_config = {"env_file": ".env", "extra": "allow"}


settings = Settings()

if not settings.DEBUG and settings.SECRET_KEY == "your-secret-key-change-in-production":
    raise RuntimeError(
        "SECRET_KEY is still the default placeholder. Set a real SECRET_KEY "
        "in the environment before running with DEBUG=false."
    )
