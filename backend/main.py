import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from core.config import settings
from core.database import init_db
from core.limiter import limiter
from api.routes import (
    auth,
    clients,
    seo,
    keywords,
    backlinks,
    content,
    images,
    social_media,
    ads,
    campaigns,
    reports,
    ai_assistant,
    alerts,
    competitors,
    seo_by_ai,
    bugs,
    knowledge,
    marketing_brain,
    integrations,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="MarketingOS API",
    description="AI Marketing Operating System - Full-scale SEO & Digital Marketing Platform",
    version="1.0.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    if not settings.DEBUG:
        response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains"
    return response

# API Routes
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(clients.router, prefix="/api/v1/clients", tags=["Clients"])
app.include_router(seo.router, prefix="/api/v1/seo", tags=["SEO"])
app.include_router(keywords.router, prefix="/api/v1/keywords", tags=["Keywords"])
app.include_router(backlinks.router, prefix="/api/v1/backlinks", tags=["Backlinks"])
app.include_router(competitors.router, prefix="/api/v1/competitors", tags=["Competitors"])
app.include_router(content.router, prefix="/api/v1/content", tags=["Content Studio"])
app.include_router(images.router, prefix="/api/v1/images", tags=["Image Studio"])
app.include_router(social_media.router, prefix="/api/v1/social", tags=["Social Media"])
app.include_router(ads.router, prefix="/api/v1/ads", tags=["Ads Manager"])
app.include_router(campaigns.router, prefix="/api/v1/campaigns", tags=["Campaigns"])
app.include_router(reports.router, prefix="/api/v1/reports", tags=["Reports"])
app.include_router(ai_assistant.router, prefix="/api/v1/ai", tags=["AI Assistant"])
app.include_router(alerts.router, prefix="/api/v1/alerts", tags=["Alerts"])
app.include_router(seo_by_ai.router, prefix="/api/v1/seo-by-ai", tags=["SEO By AI"])
app.include_router(bugs.router, prefix="/api/v1/bugs", tags=["Bug Reports"])
app.include_router(knowledge.router, prefix="/api/v1/knowledge", tags=["Knowledge Brain"])
app.include_router(marketing_brain.router, prefix="/api/v1/marketing-brain", tags=["Marketing Brain"])
app.include_router(integrations.router, prefix="/api/v1/integrations", tags=["Integrations"])


@app.get("/")
async def root():
    return {
        "name": "MarketingOS API",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "running",
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
