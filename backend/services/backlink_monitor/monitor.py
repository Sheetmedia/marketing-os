"""
Backlink Monitor Service

Provides backlink analysis, status checking, and lost backlink detection
for SEO monitoring.
"""

import asyncio
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import aiohttp

from core.config import settings

logger = logging.getLogger(__name__)


class BacklinkMonitorService:
    """Service for monitoring and analyzing backlinks."""

    def __init__(self):
        self.session: Optional[aiohttp.ClientSession] = None
        self.request_timeout = aiohttp.ClientTimeout(total=20)
        self.max_concurrent_checks = 20
        self.user_agent = (
            "Mozilla/5.0 (compatible; BacklinkChecker/1.0)"
        )

    async def _get_session(self) -> aiohttp.ClientSession:
        """Get or create an aiohttp client session."""
        if self.session is None or self.session.closed:
            self.session = aiohttp.ClientSession(
                timeout=self.request_timeout,
                headers={"User-Agent": self.user_agent},
            )
        return self.session

    async def close(self):
        """Close the underlying HTTP session."""
        if self.session and not self.session.closed:
            await self.session.close()

    async def analyze_backlinks(
        self, domain: str
    ) -> Dict[str, Any]:
        """
        Analyze the backlink profile of a domain.

        Retrieves backlink data, calculates domain authority metrics,
        and categorizes backlinks by quality.

        Args:
            domain: The domain to analyze (e.g., 'example.com').

        Returns:
            Dictionary with backlink profile data, quality metrics,
            and categorized links.
        """
        logger.info("Analyzing backlinks for domain: %s", domain)

        if not domain:
            raise ValueError("Domain is required.")

        try:
            # In production, this would call a backlink API like Ahrefs,
            # Moz, or Majestic. Here we define the structure.
            api_key = getattr(settings, "BACKLINK_API_KEY", None)
            backlinks_data = await self._fetch_backlinks_from_api(
                domain, api_key
            )

            backlinks = backlinks_data.get("backlinks", [])

            # Categorize backlinks
            dofollow = [
                b for b in backlinks if b.get("rel") != "nofollow"
            ]
            nofollow = [
                b for b in backlinks if b.get("rel") == "nofollow"
            ]

            # Quality scoring
            high_quality = [
                b
                for b in backlinks
                if b.get("domain_authority", 0) >= 50
            ]
            medium_quality = [
                b
                for b in backlinks
                if 20 <= b.get("domain_authority", 0) < 50
            ]
            low_quality = [
                b
                for b in backlinks
                if b.get("domain_authority", 0) < 20
            ]

            # Unique referring domains
            referring_domains = list(
                {b.get("source_domain", "") for b in backlinks}
            )

            # Anchor text distribution
            anchor_texts: Dict[str, int] = {}
            for backlink in backlinks:
                anchor = backlink.get("anchor_text", "").strip()
                if anchor:
                    anchor_texts[anchor] = (
                        anchor_texts.get(anchor, 0) + 1
                    )

            top_anchors = sorted(
                anchor_texts.items(), key=lambda x: x[1], reverse=True
            )[:20]

            return {
                "domain": domain,
                "total_backlinks": len(backlinks),
                "dofollow_count": len(dofollow),
                "nofollow_count": len(nofollow),
                "referring_domains": len(referring_domains),
                "quality_distribution": {
                    "high": len(high_quality),
                    "medium": len(medium_quality),
                    "low": len(low_quality),
                },
                "top_anchor_texts": [
                    {"text": text, "count": count}
                    for text, count in top_anchors
                ],
                "backlinks": backlinks[:100],
                "analyzed_at": datetime.now(timezone.utc).isoformat(),
            }

        except Exception as exc:
            logger.error(
                "Error analyzing backlinks for %s: %s",
                domain,
                str(exc),
                exc_info=True,
            )
            raise RuntimeError(
                f"Backlink analysis failed: {str(exc)}"
            ) from exc

    async def _fetch_backlinks_from_api(
        self, domain: str, api_key: Optional[str]
    ) -> Dict[str, Any]:
        """
        Fetch backlink data from a third-party API.

        Args:
            domain: Target domain.
            api_key: API key for the backlink service.

        Returns:
            Raw backlink data from the API.
        """
        if not api_key:
            logger.warning(
                "No backlink API key configured. "
                "Returning empty backlink data."
            )
            return {"backlinks": []}

        api_url = getattr(
            settings,
            "BACKLINK_API_URL",
            "https://api.backlinkservice.example.com/v1/backlinks",
        )

        try:
            session = await self._get_session()
            params = {
                "target": domain,
                "mode": "domain",
                "limit": 1000,
            }
            headers = {"Authorization": f"Bearer {api_key}"}

            async with session.get(
                api_url, params=params, headers=headers
            ) as response:
                if response.status != 200:
                    error_text = await response.text()
                    logger.error(
                        "Backlink API error (%d): %s",
                        response.status,
                        error_text,
                    )
                    return {"backlinks": []}

                return await response.json()

        except aiohttp.ClientError as exc:
            logger.error(
                "Network error fetching backlinks: %s", str(exc)
            )
            return {"backlinks": []}

    async def check_backlink_status(
        self, backlinks: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Check the live status of a list of backlinks to verify they
        are still active and pointing to the correct target.

        Args:
            backlinks: List of backlink dictionaries, each containing
                       'source_url' and 'target_url' keys.

        Returns:
            Dictionary with status results for each backlink.
        """
        logger.info("Checking status of %d backlinks", len(backlinks))

        if not backlinks:
            return {"checked": 0, "results": []}

        semaphore = asyncio.Semaphore(self.max_concurrent_checks)
        results = []

        async def _check_single(backlink: Dict[str, Any]):
            source_url = backlink.get("source_url", "")
            target_url = backlink.get("target_url", "")

            if not source_url:
                results.append(
                    {
                        **backlink,
                        "status": "error",
                        "error": "Missing source_url",
                    }
                )
                return

            async with semaphore:
                try:
                    session = await self._get_session()
                    async with session.get(source_url) as response:
                        if response.status != 200:
                            results.append(
                                {
                                    **backlink,
                                    "status": "source_unavailable",
                                    "http_status": response.status,
                                    "link_found": False,
                                }
                            )
                            return

                        html = await response.text()

                        # Check if the target URL exists in the page
                        link_found = target_url in html
                        is_nofollow = False

                        if link_found:
                            # Check for nofollow
                            from bs4 import BeautifulSoup

                            soup = BeautifulSoup(html, "html.parser")
                            link_tags = soup.find_all(
                                "a", href=lambda h: h and target_url in h
                            )
                            for tag in link_tags:
                                rel = tag.get("rel", [])
                                if "nofollow" in rel:
                                    is_nofollow = True
                                    break

                        results.append(
                            {
                                **backlink,
                                "status": (
                                    "active" if link_found else "removed"
                                ),
                                "http_status": response.status,
                                "link_found": link_found,
                                "is_nofollow": is_nofollow,
                                "checked_at": datetime.now(
                                    timezone.utc
                                ).isoformat(),
                            }
                        )

                except aiohttp.ClientError as exc:
                    results.append(
                        {
                            **backlink,
                            "status": "error",
                            "error": str(exc),
                            "checked_at": datetime.now(
                                timezone.utc
                            ).isoformat(),
                        }
                    )
                except Exception as exc:
                    logger.error(
                        "Error checking backlink %s: %s",
                        source_url,
                        str(exc),
                    )
                    results.append(
                        {
                            **backlink,
                            "status": "error",
                            "error": str(exc),
                        }
                    )

        tasks = [_check_single(bl) for bl in backlinks]
        await asyncio.gather(*tasks)

        active_count = sum(
            1 for r in results if r.get("status") == "active"
        )
        removed_count = sum(
            1 for r in results if r.get("status") == "removed"
        )
        error_count = sum(
            1 for r in results if r.get("status") == "error"
        )

        return {
            "checked": len(results),
            "active": active_count,
            "removed": removed_count,
            "errors": error_count,
            "results": results,
            "checked_at": datetime.now(timezone.utc).isoformat(),
        }

    async def detect_lost_backlinks(
        self, client_id: str
    ) -> Dict[str, Any]:
        """
        Detect backlinks that have been lost or removed for a client.

        Compares current backlink status against previously known
        backlinks to identify losses.

        Args:
            client_id: The client identifier.

        Returns:
            Dictionary with lost backlinks, impact analysis, and
            recommended actions.
        """
        logger.info(
            "Detecting lost backlinks for client: %s", client_id
        )

        if not client_id:
            raise ValueError("client_id is required.")

        try:
            # In production, this would fetch known backlinks from
            # the database and check their current status.
            # Placeholder: fetch stored backlinks for this client.
            known_backlinks = await self._get_stored_backlinks(client_id)

            if not known_backlinks:
                logger.info(
                    "No stored backlinks found for client %s", client_id
                )
                return {
                    "client_id": client_id,
                    "total_known": 0,
                    "lost_backlinks": [],
                    "impact": "none",
                }

            # Check the status of known backlinks
            status_results = await self.check_backlink_status(
                known_backlinks
            )

            lost = [
                r
                for r in status_results.get("results", [])
                if r.get("status") in ("removed", "source_unavailable")
            ]

            # Calculate impact
            total_known = len(known_backlinks)
            lost_count = len(lost)
            loss_percentage = (
                (lost_count / total_known * 100) if total_known > 0 else 0
            )

            # Categorize impact severity
            if loss_percentage > 20:
                impact = "critical"
            elif loss_percentage > 10:
                impact = "high"
            elif loss_percentage > 5:
                impact = "medium"
            else:
                impact = "low"

            # High-value losses (from high DA domains)
            high_value_losses = [
                l
                for l in lost
                if l.get("domain_authority", 0) >= 50
            ]

            return {
                "client_id": client_id,
                "total_known": total_known,
                "total_lost": lost_count,
                "loss_percentage": round(loss_percentage, 1),
                "impact": impact,
                "lost_backlinks": lost,
                "high_value_losses": high_value_losses,
                "recommendations": self._generate_loss_recommendations(
                    lost, impact
                ),
                "detected_at": datetime.now(timezone.utc).isoformat(),
            }

        except Exception as exc:
            logger.error(
                "Error detecting lost backlinks for client %s: %s",
                client_id,
                str(exc),
                exc_info=True,
            )
            raise RuntimeError(
                f"Lost backlink detection failed: {str(exc)}"
            ) from exc

    async def _get_stored_backlinks(
        self, client_id: str
    ) -> List[Dict[str, Any]]:
        """
        Retrieve previously stored backlinks for a client from the database.

        Args:
            client_id: The client identifier.

        Returns:
            List of stored backlink records.
        """
        # In production, this would query the database.
        # Returning empty list as placeholder.
        logger.debug(
            "Fetching stored backlinks for client %s", client_id
        )
        return []

    @staticmethod
    def _generate_loss_recommendations(
        lost_backlinks: List[Dict[str, Any]], impact: str
    ) -> List[str]:
        """Generate recommendations based on lost backlinks."""
        recommendations = []

        if not lost_backlinks:
            return ["No lost backlinks detected. Continue monitoring."]

        if impact in ("critical", "high"):
            recommendations.append(
                "Immediate outreach to high-authority domains that "
                "removed backlinks is recommended."
            )
            recommendations.append(
                "Investigate whether content changes on your site "
                "may have caused link removal."
            )

        removed_domains = {
            bl.get("source_domain", "")
            for bl in lost_backlinks
            if bl.get("status") == "removed"
        }
        unavailable_domains = {
            bl.get("source_domain", "")
            for bl in lost_backlinks
            if bl.get("status") == "source_unavailable"
        }

        if removed_domains:
            recommendations.append(
                f"Contact webmasters of {len(removed_domains)} "
                f"domain(s) that removed your backlinks."
            )

        if unavailable_domains:
            recommendations.append(
                f"{len(unavailable_domains)} referring domain(s) appear "
                f"to be down. Monitor and check again later."
            )

        recommendations.append(
            "Build new high-quality backlinks to compensate for losses."
        )

        return recommendations
