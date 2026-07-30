"""
Campaign Manager Service

Provides campaign creation, launching, metrics tracking, and ROI
calculation for marketing campaigns.
"""

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import uuid4

from core.config import settings

logger = logging.getLogger(__name__)


class CampaignManagerService:
    """Service for managing marketing campaigns."""

    # Campaign status constants
    STATUS_DRAFT = "draft"
    STATUS_SCHEDULED = "scheduled"
    STATUS_ACTIVE = "active"
    STATUS_PAUSED = "paused"
    STATUS_COMPLETED = "completed"
    STATUS_CANCELLED = "cancelled"

    def __init__(self):
        self.max_active_campaigns = getattr(
            settings, "MAX_ACTIVE_CAMPAIGNS", 50
        )

    async def create_campaign(
        self,
        name: str,
        campaign_type: str,
        budget: float,
        start_date: str,
        end_date: str,
        target_audience: Optional[Dict[str, Any]] = None,
        channels: Optional[List[str]] = None,
        goals: Optional[Dict[str, Any]] = None,
        client_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Create a new marketing campaign.

        Args:
            name: Campaign name.
            campaign_type: Type of campaign (seo, ppc, social, email,
                           content, display).
            budget: Total campaign budget in USD.
            start_date: Campaign start date (ISO format).
            end_date: Campaign end date (ISO format).
            target_audience: Audience targeting configuration.
            channels: List of marketing channels.
            goals: Campaign goals and KPIs.
            client_id: Associated client ID.

        Returns:
            Dictionary with the created campaign details.
        """
        logger.info(
            "Creating campaign: name='%s', type='%s', budget=%.2f",
            name,
            campaign_type,
            budget,
        )

        if not name:
            raise ValueError("Campaign name is required.")
        if budget <= 0:
            raise ValueError("Budget must be a positive number.")

        valid_types = [
            "seo",
            "ppc",
            "social",
            "email",
            "content",
            "display",
        ]
        if campaign_type not in valid_types:
            raise ValueError(
                f"Invalid campaign type. Must be one of: "
                f"{', '.join(valid_types)}"
            )

        try:
            # Parse and validate dates
            start_dt = datetime.fromisoformat(start_date)
            end_dt = datetime.fromisoformat(end_date)

            if end_dt <= start_dt:
                raise ValueError("End date must be after start date.")

            duration_days = (end_dt - start_dt).days
            daily_budget = budget / max(duration_days, 1)

            campaign = {
                "id": str(uuid4()),
                "name": name,
                "campaign_type": campaign_type,
                "status": self.STATUS_DRAFT,
                "budget": {
                    "total": budget,
                    "daily": round(daily_budget, 2),
                    "spent": 0.0,
                    "remaining": budget,
                },
                "schedule": {
                    "start_date": start_date,
                    "end_date": end_date,
                    "duration_days": duration_days,
                },
                "target_audience": target_audience or {},
                "channels": channels or [campaign_type],
                "goals": goals or {},
                "client_id": client_id,
                "metrics": {
                    "impressions": 0,
                    "clicks": 0,
                    "conversions": 0,
                    "ctr": 0.0,
                    "cpc": 0.0,
                    "cpa": 0.0,
                    "revenue": 0.0,
                },
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }

            # In production, persist to the database here.
            logger.info(
                "Campaign created: id=%s, name='%s'",
                campaign["id"],
                name,
            )
            return campaign

        except ValueError:
            raise
        except Exception as exc:
            logger.error(
                "Error creating campaign: %s",
                str(exc),
                exc_info=True,
            )
            raise RuntimeError(
                f"Campaign creation failed: {str(exc)}"
            ) from exc

    async def launch_campaign(
        self, campaign_id: str
    ) -> Dict[str, Any]:
        """
        Launch a campaign, transitioning it from draft/scheduled to active.

        Args:
            campaign_id: The unique campaign identifier.

        Returns:
            Dictionary with updated campaign status and launch details.
        """
        logger.info("Launching campaign: %s", campaign_id)

        if not campaign_id:
            raise ValueError("Campaign ID is required.")

        try:
            # In production, fetch the campaign from the database.
            # Simulate validation checks.
            campaign = await self._get_campaign(campaign_id)

            if not campaign:
                raise ValueError(
                    f"Campaign {campaign_id} not found."
                )

            current_status = campaign.get("status")
            if current_status not in (
                self.STATUS_DRAFT,
                self.STATUS_SCHEDULED,
            ):
                raise ValueError(
                    f"Campaign cannot be launched from status "
                    f"'{current_status}'. Must be 'draft' or 'scheduled'."
                )

            # Validate campaign has required configuration
            budget = campaign.get("budget", {})
            if budget.get("total", 0) <= 0:
                raise ValueError(
                    "Campaign budget must be set before launching."
                )

            # Update status
            campaign["status"] = self.STATUS_ACTIVE
            campaign["launched_at"] = datetime.now(
                timezone.utc
            ).isoformat()
            campaign["updated_at"] = datetime.now(
                timezone.utc
            ).isoformat()

            # In production, update in database and trigger
            # channel-specific activation (Google Ads API, etc.)
            logger.info(
                "Campaign %s launched successfully", campaign_id
            )

            return {
                "campaign_id": campaign_id,
                "status": self.STATUS_ACTIVE,
                "launched_at": campaign["launched_at"],
                "message": "Campaign launched successfully.",
            }

        except ValueError:
            raise
        except Exception as exc:
            logger.error(
                "Error launching campaign %s: %s",
                campaign_id,
                str(exc),
                exc_info=True,
            )
            raise RuntimeError(
                f"Campaign launch failed: {str(exc)}"
            ) from exc

    async def get_campaign_metrics(
        self, campaign_id: str
    ) -> Dict[str, Any]:
        """
        Retrieve performance metrics for a campaign.

        Args:
            campaign_id: The unique campaign identifier.

        Returns:
            Dictionary with detailed campaign performance metrics.
        """
        logger.info(
            "Retrieving metrics for campaign: %s", campaign_id
        )

        if not campaign_id:
            raise ValueError("Campaign ID is required.")

        try:
            campaign = await self._get_campaign(campaign_id)

            if not campaign:
                raise ValueError(
                    f"Campaign {campaign_id} not found."
                )

            metrics = campaign.get("metrics", {})
            budget = campaign.get("budget", {})

            # Calculate derived metrics
            impressions = metrics.get("impressions", 0)
            clicks = metrics.get("clicks", 0)
            conversions = metrics.get("conversions", 0)
            spent = budget.get("spent", 0)
            revenue = metrics.get("revenue", 0)

            ctr = (clicks / impressions * 100) if impressions > 0 else 0
            cpc = (spent / clicks) if clicks > 0 else 0
            cpa = (spent / conversions) if conversions > 0 else 0
            conversion_rate = (
                (conversions / clicks * 100) if clicks > 0 else 0
            )
            roi = await self.calculate_roi(spent, revenue)

            return {
                "campaign_id": campaign_id,
                "campaign_name": campaign.get("name", ""),
                "status": campaign.get("status", ""),
                "performance": {
                    "impressions": impressions,
                    "clicks": clicks,
                    "conversions": conversions,
                    "ctr_percentage": round(ctr, 2),
                    "cpc_usd": round(cpc, 2),
                    "cpa_usd": round(cpa, 2),
                    "conversion_rate_percentage": round(
                        conversion_rate, 2
                    ),
                },
                "budget": {
                    "total": budget.get("total", 0),
                    "spent": spent,
                    "remaining": budget.get("remaining", 0),
                    "utilization_percentage": round(
                        (
                            spent / budget.get("total", 1) * 100
                        ),
                        1,
                    ),
                },
                "revenue": {
                    "total_revenue": revenue,
                    "roi_percentage": roi["roi_percentage"],
                    "roas": roi["roas"],
                    "profit": roi["profit"],
                },
                "retrieved_at": datetime.now(
                    timezone.utc
                ).isoformat(),
            }

        except ValueError:
            raise
        except Exception as exc:
            logger.error(
                "Error retrieving campaign metrics for %s: %s",
                campaign_id,
                str(exc),
                exc_info=True,
            )
            raise RuntimeError(
                f"Campaign metrics retrieval failed: {str(exc)}"
            ) from exc

    async def calculate_roi(
        self, spend: float, revenue: float
    ) -> Dict[str, Any]:
        """
        Calculate return on investment for a campaign.

        Args:
            spend: Total amount spent on the campaign.
            revenue: Total revenue attributed to the campaign.

        Returns:
            Dictionary with ROI percentage, ROAS, profit, and assessment.
        """
        if spend < 0:
            raise ValueError("Spend cannot be negative.")

        profit = revenue - spend
        roi_percentage = (
            (profit / spend * 100) if spend > 0 else 0
        )
        roas = (revenue / spend) if spend > 0 else 0

        # Assess performance
        if roi_percentage > 200:
            assessment = "excellent"
        elif roi_percentage > 100:
            assessment = "good"
        elif roi_percentage > 0:
            assessment = "positive"
        elif roi_percentage == 0:
            assessment = "break_even"
        else:
            assessment = "negative"

        return {
            "spend": spend,
            "revenue": revenue,
            "profit": round(profit, 2),
            "roi_percentage": round(roi_percentage, 2),
            "roas": round(roas, 2),
            "assessment": assessment,
        }

    async def _get_campaign(
        self, campaign_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        Retrieve a campaign by ID from the database.

        Args:
            campaign_id: The campaign identifier.

        Returns:
            Campaign dictionary or None if not found.
        """
        # In production, this would query the database.
        logger.debug("Fetching campaign: %s", campaign_id)
        return None
