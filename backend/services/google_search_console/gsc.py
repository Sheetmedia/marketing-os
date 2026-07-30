"""
Google Search Console Service

OAuth 2.0 + Search Analytics API client. Provides real organic traffic,
impressions, average position, and top query/page data for a client's
own verified property — free, no paid third-party subscription required.
"""

import logging
from typing import Any, Dict, List, Optional
from urllib.parse import quote, urlencode

import httpx

from core.config import settings

logger = logging.getLogger(__name__)

AUTH_BASE_URL = "https://accounts.google.com/o/oauth2/v2/auth"
TOKEN_URL = "https://oauth2.googleapis.com/token"
SCOPE = "https://www.googleapis.com/auth/webmasters.readonly"


def build_auth_url(state: str) -> str:
    """Build the Google consent screen URL for a given signed state token."""
    params = {
        "client_id": settings.GOOGLE_OAUTH_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_OAUTH_REDIRECT_URI,
        "response_type": "code",
        "scope": SCOPE,
        "access_type": "offline",
        "prompt": "consent",
        "state": state,
    }
    return f"{AUTH_BASE_URL}?{urlencode(params)}"


class GoogleSearchConsoleService:
    """Client for Google's OAuth token endpoints and Search Console v3 API."""

    def __init__(self):
        self.client = httpx.AsyncClient(timeout=30.0)

    async def close(self):
        await self.client.aclose()

    async def exchange_code(self, code: str) -> Dict[str, Any]:
        """Exchange an OAuth authorization code for access/refresh tokens."""
        resp = await self.client.post(TOKEN_URL, data={
            "code": code,
            "client_id": settings.GOOGLE_OAUTH_CLIENT_ID,
            "client_secret": settings.GOOGLE_OAUTH_CLIENT_SECRET,
            "redirect_uri": settings.GOOGLE_OAUTH_REDIRECT_URI,
            "grant_type": "authorization_code",
        })
        resp.raise_for_status()
        return resp.json()

    async def refresh_access_token(self, refresh_token: str) -> Dict[str, Any]:
        """Exchange a refresh token for a new short-lived access token."""
        resp = await self.client.post(TOKEN_URL, data={
            "refresh_token": refresh_token,
            "client_id": settings.GOOGLE_OAUTH_CLIENT_ID,
            "client_secret": settings.GOOGLE_OAUTH_CLIENT_SECRET,
            "grant_type": "refresh_token",
        })
        resp.raise_for_status()
        return resp.json()

    async def list_sites(self, access_token: str) -> List[Dict[str, Any]]:
        """List Search Console properties the authenticated Google account can access."""
        resp = await self.client.get(
            "https://www.googleapis.com/webmasters/v3/sites",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        resp.raise_for_status()
        return resp.json().get("siteEntry", [])

    async def query_search_analytics(
        self,
        access_token: str,
        site_url: str,
        start_date: str,
        end_date: str,
        dimensions: Optional[List[str]] = None,
        row_limit: int = 25,
    ) -> Dict[str, Any]:
        """Run a Search Analytics query (clicks/impressions/ctr/position) for a property."""
        url = (
            "https://www.googleapis.com/webmasters/v3/sites/"
            f"{quote(site_url, safe='')}/searchAnalytics/query"
        )
        resp = await self.client.post(
            url,
            headers={"Authorization": f"Bearer {access_token}"},
            json={
                "startDate": start_date,
                "endDate": end_date,
                "dimensions": dimensions or [],
                "rowLimit": row_limit,
            },
        )
        resp.raise_for_status()
        return resp.json()
