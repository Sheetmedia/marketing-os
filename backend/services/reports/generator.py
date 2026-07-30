"""
Report Generator Service

Provides generation of SEO reports, ads reports, and comprehensive
marketing reports with data compilation and formatting.
"""

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import uuid4

from core.config import settings

logger = logging.getLogger(__name__)


class ReportGeneratorService:
    """Service for generating marketing and SEO reports."""

    def __init__(self):
        self.default_date_format = "%Y-%m-%d"

    async def generate_seo_report(
        self,
        client_id: str,
        date_range: Optional[Dict[str, str]] = None,
        include_sections: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Generate a comprehensive SEO performance report.

        Args:
            client_id: The client identifier.
            date_range: Optional dict with 'start' and 'end' ISO dates.
            include_sections: Optional list of sections to include
                              (e.g., 'rankings', 'traffic', 'backlinks',
                              'technical', 'content').

        Returns:
            Dictionary with the full SEO report data.
        """
        logger.info("Generating SEO report for client: %s", client_id)

        if not client_id:
            raise ValueError("client_id is required.")

        sections = include_sections or [
            "rankings",
            "traffic",
            "backlinks",
            "technical",
            "content",
            "competitors",
        ]

        try:
            report_data = await self.compile_report_data(
                client_id, "seo", date_range
            )

            report = {
                "id": str(uuid4()),
                "type": "seo",
                "client_id": client_id,
                "date_range": date_range or {
                    "start": "last_30_days",
                    "end": "today",
                },
                "generated_at": datetime.now(
                    timezone.utc
                ).isoformat(),
                "sections": {},
            }

            if "rankings" in sections:
                report["sections"]["rankings"] = {
                    "title": "Keyword Rankings",
                    "summary": report_data.get(
                        "rankings_summary", {}
                    ),
                    "keywords_tracked": report_data.get(
                        "keywords_tracked", 0
                    ),
                    "keywords_in_top_10": report_data.get(
                        "keywords_in_top_10", 0
                    ),
                    "average_position": report_data.get(
                        "average_position", 0
                    ),
                    "position_changes": report_data.get(
                        "position_changes", []
                    ),
                }

            if "traffic" in sections:
                report["sections"]["traffic"] = {
                    "title": "Organic Traffic",
                    "summary": report_data.get(
                        "traffic_summary", {}
                    ),
                    "total_sessions": report_data.get(
                        "total_sessions", 0
                    ),
                    "organic_sessions": report_data.get(
                        "organic_sessions", 0
                    ),
                    "organic_percentage": report_data.get(
                        "organic_percentage", 0
                    ),
                    "top_landing_pages": report_data.get(
                        "top_landing_pages", []
                    ),
                }

            if "backlinks" in sections:
                report["sections"]["backlinks"] = {
                    "title": "Backlink Profile",
                    "summary": report_data.get(
                        "backlinks_summary", {}
                    ),
                    "total_backlinks": report_data.get(
                        "total_backlinks", 0
                    ),
                    "new_backlinks": report_data.get(
                        "new_backlinks", 0
                    ),
                    "lost_backlinks": report_data.get(
                        "lost_backlinks", 0
                    ),
                    "referring_domains": report_data.get(
                        "referring_domains", 0
                    ),
                }

            if "technical" in sections:
                report["sections"]["technical"] = {
                    "title": "Technical SEO",
                    "summary": report_data.get(
                        "technical_summary", {}
                    ),
                    "seo_score": report_data.get("seo_score", 0),
                    "issues_found": report_data.get(
                        "issues_found", 0
                    ),
                    "issues_fixed": report_data.get(
                        "issues_fixed", 0
                    ),
                    "core_web_vitals": report_data.get(
                        "core_web_vitals", {}
                    ),
                }

            if "content" in sections:
                report["sections"]["content"] = {
                    "title": "Content Performance",
                    "summary": report_data.get(
                        "content_summary", {}
                    ),
                    "pages_indexed": report_data.get(
                        "pages_indexed", 0
                    ),
                    "top_performing_content": report_data.get(
                        "top_performing_content", []
                    ),
                    "content_gaps": report_data.get(
                        "content_gaps", []
                    ),
                }

            if "competitors" in sections:
                report["sections"]["competitors"] = {
                    "title": "Competitor Analysis",
                    "summary": report_data.get(
                        "competitor_summary", {}
                    ),
                    "competitors": report_data.get(
                        "competitors", []
                    ),
                }

            logger.info(
                "SEO report generated: id=%s, sections=%d",
                report["id"],
                len(report["sections"]),
            )
            return report

        except Exception as exc:
            logger.error(
                "Error generating SEO report for client %s: %s",
                client_id,
                str(exc),
                exc_info=True,
            )
            raise RuntimeError(
                f"SEO report generation failed: {str(exc)}"
            ) from exc

    async def generate_ads_report(
        self,
        client_id: str,
        platforms: Optional[List[str]] = None,
        date_range: Optional[Dict[str, str]] = None,
    ) -> Dict[str, Any]:
        """
        Generate an advertising performance report across platforms.

        Args:
            client_id: The client identifier.
            platforms: List of platforms to include (google_ads, facebook,
                       instagram, linkedin). Defaults to all.
            date_range: Optional date range filter.

        Returns:
            Dictionary with cross-platform ads performance data.
        """
        logger.info("Generating ads report for client: %s", client_id)

        if not client_id:
            raise ValueError("client_id is required.")

        platforms = platforms or [
            "google_ads",
            "facebook",
            "instagram",
            "linkedin",
        ]

        try:
            report_data = await self.compile_report_data(
                client_id, "ads", date_range
            )

            report = {
                "id": str(uuid4()),
                "type": "ads",
                "client_id": client_id,
                "platforms": platforms,
                "date_range": date_range or {
                    "start": "last_30_days",
                    "end": "today",
                },
                "generated_at": datetime.now(
                    timezone.utc
                ).isoformat(),
                "overall_metrics": {
                    "total_spend": report_data.get(
                        "total_spend", 0
                    ),
                    "total_impressions": report_data.get(
                        "total_impressions", 0
                    ),
                    "total_clicks": report_data.get(
                        "total_clicks", 0
                    ),
                    "total_conversions": report_data.get(
                        "total_conversions", 0
                    ),
                    "overall_ctr": report_data.get("overall_ctr", 0),
                    "overall_cpc": report_data.get("overall_cpc", 0),
                    "overall_roas": report_data.get(
                        "overall_roas", 0
                    ),
                    "total_revenue": report_data.get(
                        "total_revenue", 0
                    ),
                },
                "platform_breakdown": {},
                "top_campaigns": report_data.get(
                    "top_campaigns", []
                ),
                "recommendations": report_data.get(
                    "recommendations", []
                ),
            }

            for platform in platforms:
                platform_data = report_data.get(
                    f"{platform}_metrics", {}
                )
                report["platform_breakdown"][platform] = {
                    "spend": platform_data.get("spend", 0),
                    "impressions": platform_data.get("impressions", 0),
                    "clicks": platform_data.get("clicks", 0),
                    "conversions": platform_data.get("conversions", 0),
                    "ctr": platform_data.get("ctr", 0),
                    "cpc": platform_data.get("cpc", 0),
                    "roas": platform_data.get("roas", 0),
                }

            logger.info("Ads report generated: id=%s", report["id"])
            return report

        except Exception as exc:
            logger.error(
                "Error generating ads report for client %s: %s",
                client_id,
                str(exc),
                exc_info=True,
            )
            raise RuntimeError(
                f"Ads report generation failed: {str(exc)}"
            ) from exc

    async def generate_comprehensive_report(
        self,
        client_id: str,
        date_range: Optional[Dict[str, str]] = None,
    ) -> Dict[str, Any]:
        """
        Generate a comprehensive marketing report combining SEO,
        ads, content, and social media performance.

        Args:
            client_id: The client identifier.
            date_range: Optional date range filter.

        Returns:
            Dictionary with the full comprehensive report.
        """
        logger.info(
            "Generating comprehensive report for client: %s",
            client_id,
        )

        if not client_id:
            raise ValueError("client_id is required.")

        try:
            seo_report = await self.generate_seo_report(
                client_id, date_range
            )
            ads_report = await self.generate_ads_report(
                client_id, date_range=date_range
            )

            report = {
                "id": str(uuid4()),
                "type": "comprehensive",
                "client_id": client_id,
                "date_range": date_range or {
                    "start": "last_30_days",
                    "end": "today",
                },
                "generated_at": datetime.now(
                    timezone.utc
                ).isoformat(),
                "executive_summary": {
                    "seo_health_score": (
                        seo_report.get("sections", {})
                        .get("technical", {})
                        .get("seo_score", 0)
                    ),
                    "total_organic_sessions": (
                        seo_report.get("sections", {})
                        .get("traffic", {})
                        .get("organic_sessions", 0)
                    ),
                    "total_ad_spend": (
                        ads_report.get("overall_metrics", {})
                        .get("total_spend", 0)
                    ),
                    "total_ad_revenue": (
                        ads_report.get("overall_metrics", {})
                        .get("total_revenue", 0)
                    ),
                    "overall_roas": (
                        ads_report.get("overall_metrics", {})
                        .get("overall_roas", 0)
                    ),
                },
                "seo": seo_report,
                "advertising": ads_report,
                "action_items": await self._generate_action_items(
                    seo_report, ads_report
                ),
            }

            logger.info(
                "Comprehensive report generated: id=%s", report["id"]
            )
            return report

        except Exception as exc:
            logger.error(
                "Error generating comprehensive report for client %s: %s",
                client_id,
                str(exc),
                exc_info=True,
            )
            raise RuntimeError(
                f"Comprehensive report generation failed: {str(exc)}"
            ) from exc

    async def compile_report_data(
        self,
        client_id: str,
        report_type: str,
        date_range: Optional[Dict[str, str]] = None,
    ) -> Dict[str, Any]:
        """
        Compile raw data from various sources needed for report generation.

        Args:
            client_id: The client identifier.
            report_type: Type of report ('seo', 'ads', 'comprehensive').
            date_range: Optional date range filter.

        Returns:
            Dictionary with compiled raw data for the report.
        """
        logger.info(
            "Compiling report data: client=%s, type=%s",
            client_id,
            report_type,
        )

        compiled_data: Dict[str, Any] = {
            "client_id": client_id,
            "report_type": report_type,
            "date_range": date_range,
            "compiled_at": datetime.now(timezone.utc).isoformat(),
        }

        try:
            if report_type in ("seo", "comprehensive"):
                # In production, these would fetch from the database
                # and external APIs.
                compiled_data.update(
                    {
                        "rankings_summary": {},
                        "keywords_tracked": 0,
                        "keywords_in_top_10": 0,
                        "average_position": 0,
                        "position_changes": [],
                        "traffic_summary": {},
                        "total_sessions": 0,
                        "organic_sessions": 0,
                        "organic_percentage": 0,
                        "top_landing_pages": [],
                        "backlinks_summary": {},
                        "total_backlinks": 0,
                        "new_backlinks": 0,
                        "lost_backlinks": 0,
                        "referring_domains": 0,
                        "technical_summary": {},
                        "seo_score": 0,
                        "issues_found": 0,
                        "issues_fixed": 0,
                        "core_web_vitals": {},
                        "content_summary": {},
                        "pages_indexed": 0,
                        "top_performing_content": [],
                        "content_gaps": [],
                        "competitor_summary": {},
                        "competitors": [],
                    }
                )

            if report_type in ("ads", "comprehensive"):
                compiled_data.update(
                    {
                        "total_spend": 0,
                        "total_impressions": 0,
                        "total_clicks": 0,
                        "total_conversions": 0,
                        "overall_ctr": 0,
                        "overall_cpc": 0,
                        "overall_roas": 0,
                        "total_revenue": 0,
                        "top_campaigns": [],
                        "recommendations": [],
                    }
                )

            return compiled_data

        except Exception as exc:
            logger.error(
                "Error compiling report data: %s",
                str(exc),
                exc_info=True,
            )
            raise RuntimeError(
                f"Report data compilation failed: {str(exc)}"
            ) from exc

    async def _generate_action_items(
        self,
        seo_report: Dict[str, Any],
        ads_report: Dict[str, Any],
    ) -> List[Dict[str, Any]]:
        """
        Generate prioritized action items from report data.

        Args:
            seo_report: The SEO report data.
            ads_report: The ads report data.

        Returns:
            List of prioritized action items.
        """
        action_items = []

        # Check SEO issues
        technical = (
            seo_report.get("sections", {}).get("technical", {})
        )
        if technical.get("issues_found", 0) > 0:
            action_items.append(
                {
                    "priority": "high",
                    "category": "seo",
                    "title": "Fix Technical SEO Issues",
                    "description": (
                        f"{technical['issues_found']} technical issues "
                        f"were detected. Address critical issues first."
                    ),
                }
            )

        seo_score = technical.get("seo_score", 100)
        if seo_score < 70:
            action_items.append(
                {
                    "priority": "high",
                    "category": "seo",
                    "title": "Improve SEO Score",
                    "description": (
                        f"Current SEO score is {seo_score}/100. "
                        f"Focus on on-page and technical improvements."
                    ),
                }
            )

        # Check ad performance
        overall_metrics = ads_report.get("overall_metrics", {})
        roas = overall_metrics.get("overall_roas", 0)
        if roas > 0 and roas < 2:
            action_items.append(
                {
                    "priority": "medium",
                    "category": "ads",
                    "title": "Optimize Ad ROAS",
                    "description": (
                        f"Current ROAS is {roas}x. Review targeting, "
                        f"creative, and bidding strategies."
                    ),
                }
            )

        return action_items
