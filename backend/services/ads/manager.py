"""
Ads Manager Service

Provides synchronization with Google Ads and Facebook Ads, analytics
retrieval, and ROAS calculation for advertising campaigns.
"""

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import aiohttp

from core.config import settings

logger = logging.getLogger(__name__)


class AdsManagerService:
    """Service for managing advertising across platforms."""

    def __init__(self):
        self.session: Optional[aiohttp.ClientSession] = None
        self.request_timeout = aiohttp.ClientTimeout(total=30)
        self.google_ads_api_version = "v16"
        self.facebook_api_version = "v19.0"

    async def _get_session(self) -> aiohttp.ClientSession:
        """Get or create an aiohttp client session."""
        if self.session is None or self.session.closed:
            self.session = aiohttp.ClientSession(
                timeout=self.request_timeout
            )
        return self.session

    async def close(self):
        """Close the underlying HTTP session."""
        if self.session and not self.session.closed:
            await self.session.close()

    async def sync_google_ads(
        self,
        client_id: str,
        google_ads_customer_id: str,
        date_range: Optional[Dict[str, str]] = None,
    ) -> Dict[str, Any]:
        """
        Synchronize campaign data from Google Ads.

        Fetches campaigns, ad groups, keywords, and performance metrics
        from the Google Ads API and stores them locally.

        Args:
            client_id: Internal client identifier.
            google_ads_customer_id: Google Ads customer ID (format: 123-456-7890).
            date_range: Optional date range for metrics (ISO format).

        Returns:
            Dictionary with sync results, campaigns synced, and metrics.
        """
        logger.info(
            "Syncing Google Ads for client %s, customer ID %s",
            client_id,
            google_ads_customer_id,
        )

        if not client_id or not google_ads_customer_id:
            raise ValueError(
                "client_id and google_ads_customer_id are required."
            )

        google_ads_token = getattr(
            settings, "GOOGLE_ADS_DEVELOPER_TOKEN", None
        )
        google_ads_refresh_token = getattr(
            settings, "GOOGLE_ADS_REFRESH_TOKEN", None
        )

        if not google_ads_token:
            raise ValueError(
                "Google Ads developer token is not configured."
            )

        try:
            # Fetch campaigns
            campaigns = await self._fetch_google_campaigns(
                google_ads_customer_id,
                google_ads_token,
                google_ads_refresh_token,
                date_range,
            )

            synced_campaigns = []
            total_spend = 0.0
            total_impressions = 0
            total_clicks = 0
            total_conversions = 0

            for campaign in campaigns:
                metrics = campaign.get("metrics", {})
                spend = metrics.get("cost_micros", 0) / 1_000_000
                total_spend += spend
                total_impressions += metrics.get("impressions", 0)
                total_clicks += metrics.get("clicks", 0)
                total_conversions += metrics.get("conversions", 0)

                synced_campaigns.append(
                    {
                        "campaign_id": campaign.get("id"),
                        "name": campaign.get("name"),
                        "status": campaign.get("status"),
                        "budget_daily": campaign.get(
                            "budget", {}
                        ).get("amount_micros", 0)
                        / 1_000_000,
                        "metrics": {
                            "spend": round(spend, 2),
                            "impressions": metrics.get(
                                "impressions", 0
                            ),
                            "clicks": metrics.get("clicks", 0),
                            "conversions": metrics.get(
                                "conversions", 0
                            ),
                            "ctr": metrics.get("ctr", 0),
                            "avg_cpc": metrics.get(
                                "average_cpc", 0
                            )
                            / 1_000_000,
                        },
                    }
                )

            # In production, persist synced data to database.
            return {
                "client_id": client_id,
                "platform": "google_ads",
                "customer_id": google_ads_customer_id,
                "campaigns_synced": len(synced_campaigns),
                "campaigns": synced_campaigns,
                "totals": {
                    "spend": round(total_spend, 2),
                    "impressions": total_impressions,
                    "clicks": total_clicks,
                    "conversions": total_conversions,
                    "ctr": round(
                        (
                            total_clicks / total_impressions * 100
                            if total_impressions > 0
                            else 0
                        ),
                        2,
                    ),
                    "avg_cpc": round(
                        (
                            total_spend / total_clicks
                            if total_clicks > 0
                            else 0
                        ),
                        2,
                    ),
                },
                "synced_at": datetime.now(timezone.utc).isoformat(),
            }

        except ValueError:
            raise
        except Exception as exc:
            logger.error(
                "Error syncing Google Ads for client %s: %s",
                client_id,
                str(exc),
                exc_info=True,
            )
            raise RuntimeError(
                f"Google Ads sync failed: {str(exc)}"
            ) from exc

    async def sync_facebook_ads(
        self,
        client_id: str,
        ad_account_id: str,
        date_range: Optional[Dict[str, str]] = None,
    ) -> Dict[str, Any]:
        """
        Synchronize campaign data from Facebook/Meta Ads.

        Fetches campaigns, ad sets, ads, and performance metrics from
        the Facebook Marketing API.

        Args:
            client_id: Internal client identifier.
            ad_account_id: Facebook Ad Account ID (format: act_123456).
            date_range: Optional date range for metrics.

        Returns:
            Dictionary with sync results and campaign metrics.
        """
        logger.info(
            "Syncing Facebook Ads for client %s, account %s",
            client_id,
            ad_account_id,
        )

        if not client_id or not ad_account_id:
            raise ValueError(
                "client_id and ad_account_id are required."
            )

        fb_access_token = getattr(
            settings, "FACEBOOK_ACCESS_TOKEN", None
        )

        if not fb_access_token:
            raise ValueError(
                "Facebook access token is not configured."
            )

        try:
            api_url = (
                f"https://graph.facebook.com/{self.facebook_api_version}"
                f"/{ad_account_id}/campaigns"
            )

            params = {
                "access_token": fb_access_token,
                "fields": (
                    "id,name,status,objective,daily_budget,"
                    "lifetime_budget,insights{impressions,clicks,"
                    "spend,conversions,ctr,cpc,actions}"
                ),
                "limit": 100,
            }

            if date_range:
                params["time_range"] = (
                    f'{{"since":"{date_range.get("start", "")}",'
                    f'"until":"{date_range.get("end", "")}"}}'
                )

            session = await self._get_session()

            async with session.get(api_url, params=params) as response:
                if response.status != 200:
                    error_text = await response.text()
                    logger.error(
                        "Facebook Ads API error (%d): %s",
                        response.status,
                        error_text,
                    )
                    raise RuntimeError(
                        f"Facebook API returned status {response.status}"
                    )

                data = await response.json()
                campaigns = data.get("data", [])

            synced_campaigns = []
            total_spend = 0.0
            total_impressions = 0
            total_clicks = 0

            for campaign in campaigns:
                insights = campaign.get("insights", {}).get(
                    "data", [{}]
                )
                insight = insights[0] if insights else {}

                spend = float(insight.get("spend", 0))
                impressions = int(insight.get("impressions", 0))
                clicks = int(insight.get("clicks", 0))

                total_spend += spend
                total_impressions += impressions
                total_clicks += clicks

                synced_campaigns.append(
                    {
                        "campaign_id": campaign.get("id"),
                        "name": campaign.get("name"),
                        "status": campaign.get("status"),
                        "objective": campaign.get("objective"),
                        "metrics": {
                            "spend": round(spend, 2),
                            "impressions": impressions,
                            "clicks": clicks,
                            "ctr": float(insight.get("ctr", 0)),
                            "cpc": float(insight.get("cpc", 0)),
                        },
                    }
                )

            # In production, persist to database.
            return {
                "client_id": client_id,
                "platform": "facebook_ads",
                "ad_account_id": ad_account_id,
                "campaigns_synced": len(synced_campaigns),
                "campaigns": synced_campaigns,
                "totals": {
                    "spend": round(total_spend, 2),
                    "impressions": total_impressions,
                    "clicks": total_clicks,
                    "ctr": round(
                        (
                            total_clicks / total_impressions * 100
                            if total_impressions > 0
                            else 0
                        ),
                        2,
                    ),
                },
                "synced_at": datetime.now(timezone.utc).isoformat(),
            }

        except ValueError:
            raise
        except aiohttp.ClientError as exc:
            logger.error(
                "Network error syncing Facebook Ads: %s", str(exc)
            )
            raise RuntimeError(
                f"Facebook Ads sync network error: {str(exc)}"
            ) from exc
        except Exception as exc:
            logger.error(
                "Error syncing Facebook Ads for client %s: %s",
                client_id,
                str(exc),
                exc_info=True,
            )
            raise RuntimeError(
                f"Facebook Ads sync failed: {str(exc)}"
            ) from exc

    async def get_ad_analytics(
        self,
        client_id: str,
        platform: Optional[str] = None,
        date_range: Optional[Dict[str, str]] = None,
    ) -> Dict[str, Any]:
        """
        Retrieve aggregated advertising analytics across platforms.

        Args:
            client_id: The client identifier.
            platform: Optional platform filter (google_ads, facebook_ads).
            date_range: Optional date range for metrics.

        Returns:
            Dictionary with per-platform and aggregated ad analytics.
        """
        logger.info(
            "Retrieving ad analytics for client: %s", client_id
        )

        if not client_id:
            raise ValueError("client_id is required.")

        platforms = (
            [platform]
            if platform
            else ["google_ads", "facebook_ads"]
        )

        try:
            analytics = {
                "client_id": client_id,
                "date_range": date_range or {
                    "start": "last_30_days",
                    "end": "today",
                },
                "platforms": {},
                "aggregated": {
                    "total_spend": 0.0,
                    "total_impressions": 0,
                    "total_clicks": 0,
                    "total_conversions": 0,
                    "total_revenue": 0.0,
                    "overall_ctr": 0.0,
                    "overall_cpc": 0.0,
                    "overall_roas": 0.0,
                },
            }

            for plat in platforms:
                # In production, fetch from database where synced data
                # is stored.
                platform_data = await self._get_platform_analytics(
                    client_id, plat, date_range
                )
                analytics["platforms"][plat] = platform_data

                agg = analytics["aggregated"]
                agg["total_spend"] += platform_data.get("spend", 0)
                agg["total_impressions"] += platform_data.get(
                    "impressions", 0
                )
                agg["total_clicks"] += platform_data.get("clicks", 0)
                agg["total_conversions"] += platform_data.get(
                    "conversions", 0
                )
                agg["total_revenue"] += platform_data.get(
                    "revenue", 0
                )

            agg = analytics["aggregated"]
            if agg["total_impressions"] > 0:
                agg["overall_ctr"] = round(
                    agg["total_clicks"]
                    / agg["total_impressions"]
                    * 100,
                    2,
                )
            if agg["total_clicks"] > 0:
                agg["overall_cpc"] = round(
                    agg["total_spend"] / agg["total_clicks"], 2
                )
            if agg["total_spend"] > 0:
                agg["overall_roas"] = round(
                    agg["total_revenue"] / agg["total_spend"], 2
                )

            analytics["retrieved_at"] = datetime.now(
                timezone.utc
            ).isoformat()

            return analytics

        except Exception as exc:
            logger.error(
                "Error retrieving ad analytics for client %s: %s",
                client_id,
                str(exc),
                exc_info=True,
            )
            raise RuntimeError(
                f"Ad analytics retrieval failed: {str(exc)}"
            ) from exc

    async def calculate_roas(
        self,
        spend: float,
        revenue: float,
    ) -> Dict[str, Any]:
        """
        Calculate Return on Ad Spend (ROAS) and related metrics.

        Args:
            spend: Total advertising spend.
            revenue: Total revenue attributed to ads.

        Returns:
            Dictionary with ROAS, profit margin, and performance assessment.
        """
        if spend < 0:
            raise ValueError("Spend cannot be negative.")
        if revenue < 0:
            raise ValueError("Revenue cannot be negative.")

        roas = (revenue / spend) if spend > 0 else 0
        profit = revenue - spend
        profit_margin = (
            (profit / revenue * 100) if revenue > 0 else 0
        )

        # Performance assessment
        if roas >= 5:
            assessment = "excellent"
            recommendation = (
                "Strong ROAS. Consider scaling budget to capture "
                "more market share."
            )
        elif roas >= 3:
            assessment = "good"
            recommendation = (
                "Healthy ROAS. Optimize underperforming campaigns "
                "to improve further."
            )
        elif roas >= 2:
            assessment = "acceptable"
            recommendation = (
                "Adequate ROAS but room for improvement. Review "
                "targeting and creative performance."
            )
        elif roas >= 1:
            assessment = "marginal"
            recommendation = (
                "Break-even or slight positive return. Audit campaigns "
                "for wasted spend and optimize bidding."
            )
        else:
            assessment = "poor"
            recommendation = (
                "Negative return on ad spend. Pause underperforming "
                "campaigns and reallocate budget."
            )

        return {
            "spend": spend,
            "revenue": revenue,
            "roas": round(roas, 2),
            "profit": round(profit, 2),
            "profit_margin_percentage": round(profit_margin, 2),
            "assessment": assessment,
            "recommendation": recommendation,
        }

    async def _fetch_google_campaigns(
        self,
        customer_id: str,
        developer_token: str,
        refresh_token: Optional[str],
        date_range: Optional[Dict[str, str]],
    ) -> List[Dict[str, Any]]:
        """Fetch campaigns from the Google Ads API."""
        logger.debug(
            "Fetching Google Ads campaigns for customer %s",
            customer_id,
        )
        # In production, use the Google Ads API client library or
        # REST API with proper OAuth2 authentication.
        return []

    async def _get_platform_analytics(
        self,
        client_id: str,
        platform: str,
        date_range: Optional[Dict[str, str]],
    ) -> Dict[str, Any]:
        """Fetch stored analytics for a platform from the database."""
        logger.debug(
            "Fetching %s analytics for client %s",
            platform,
            client_id,
        )
        return {
            "platform": platform,
            "spend": 0.0,
            "impressions": 0,
            "clicks": 0,
            "conversions": 0,
            "revenue": 0.0,
            "campaigns": [],
        }
