"""
Alert Monitor Service

Provides automated monitoring for ranking drops, backlink losses,
traffic drops, and other SEO-critical events with configurable
alert thresholds.
"""

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import uuid4

from core.config import settings

logger = logging.getLogger(__name__)


class AlertMonitorService:
    """Service for monitoring SEO metrics and generating alerts."""

    # Alert severity levels
    SEVERITY_CRITICAL = "critical"
    SEVERITY_HIGH = "high"
    SEVERITY_MEDIUM = "medium"
    SEVERITY_LOW = "low"
    SEVERITY_INFO = "info"

    # Alert types
    TYPE_RANKING_DROP = "ranking_drop"
    TYPE_BACKLINK_LOSS = "backlink_loss"
    TYPE_TRAFFIC_DROP = "traffic_drop"
    TYPE_CRAWL_ERROR = "crawl_error"
    TYPE_UPTIME = "uptime"

    def __init__(self):
        self.default_thresholds = {
            "ranking_drop_positions": 5,
            "ranking_drop_percentage": 20,
            "backlink_loss_count": 5,
            "backlink_loss_percentage": 10,
            "traffic_drop_percentage": 15,
            "traffic_drop_sessions": 100,
        }

    async def check_ranking_drops(
        self,
        client_id: str,
        thresholds: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Check for significant keyword ranking drops.

        Compares current rankings against previous data to detect
        drops exceeding the configured thresholds.

        Args:
            client_id: The client identifier.
            thresholds: Optional custom thresholds. Keys:
                        - positions: minimum position drop to alert on.
                        - percentage: minimum percentage drop to alert on.

        Returns:
            Dictionary with detected ranking drops and generated alerts.
        """
        logger.info(
            "Checking ranking drops for client: %s", client_id
        )

        if not client_id:
            raise ValueError("client_id is required.")

        position_threshold = (
            (thresholds or {}).get(
                "positions",
                self.default_thresholds["ranking_drop_positions"],
            )
        )
        percentage_threshold = (
            (thresholds or {}).get(
                "percentage",
                self.default_thresholds["ranking_drop_percentage"],
            )
        )

        try:
            # In production, fetch current and historical ranking data
            # from the database.
            current_rankings = await self._get_current_rankings(
                client_id
            )
            previous_rankings = await self._get_previous_rankings(
                client_id
            )

            drops = []
            alerts = []

            for keyword, current_pos in current_rankings.items():
                prev_pos = previous_rankings.get(keyword)
                if prev_pos is None:
                    continue

                position_change = current_pos - prev_pos
                if prev_pos > 0:
                    pct_change = (
                        (current_pos - prev_pos) / prev_pos * 100
                    )
                else:
                    pct_change = 0

                # A positive position_change means the ranking dropped
                # (position number increased)
                if (
                    position_change >= position_threshold
                    or pct_change >= percentage_threshold
                ):
                    severity = self._calculate_ranking_severity(
                        position_change, prev_pos
                    )

                    drop_info = {
                        "keyword": keyword,
                        "previous_position": prev_pos,
                        "current_position": current_pos,
                        "positions_dropped": position_change,
                        "percentage_change": round(pct_change, 1),
                    }
                    drops.append(drop_info)

                    alert = await self.create_alert(
                        client_id=client_id,
                        alert_type=self.TYPE_RANKING_DROP,
                        severity=severity,
                        title=(
                            f"Ranking drop for '{keyword}': "
                            f"position {prev_pos} -> {current_pos}"
                        ),
                        details=drop_info,
                    )
                    alerts.append(alert)

            return {
                "client_id": client_id,
                "keywords_checked": len(current_rankings),
                "drops_detected": len(drops),
                "drops": drops,
                "alerts_generated": len(alerts),
                "alerts": alerts,
                "checked_at": datetime.now(
                    timezone.utc
                ).isoformat(),
            }

        except Exception as exc:
            logger.error(
                "Error checking ranking drops for client %s: %s",
                client_id,
                str(exc),
                exc_info=True,
            )
            raise RuntimeError(
                f"Ranking drop check failed: {str(exc)}"
            ) from exc

    async def check_backlink_losses(
        self,
        client_id: str,
        thresholds: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Check for significant backlink losses.

        Args:
            client_id: The client identifier.
            thresholds: Optional custom thresholds. Keys:
                        - count: minimum lost backlinks to trigger alert.
                        - percentage: minimum loss percentage to alert on.

        Returns:
            Dictionary with detected backlink losses and alerts.
        """
        logger.info(
            "Checking backlink losses for client: %s", client_id
        )

        if not client_id:
            raise ValueError("client_id is required.")

        count_threshold = (
            (thresholds or {}).get(
                "count",
                self.default_thresholds["backlink_loss_count"],
            )
        )
        pct_threshold = (
            (thresholds or {}).get(
                "percentage",
                self.default_thresholds["backlink_loss_percentage"],
            )
        )

        try:
            # In production, fetch backlink data from database.
            current_count = await self._get_current_backlink_count(
                client_id
            )
            previous_count = await self._get_previous_backlink_count(
                client_id
            )
            lost_backlinks = await self._get_lost_backlinks(client_id)

            lost_count = len(lost_backlinks)
            loss_percentage = (
                (lost_count / previous_count * 100)
                if previous_count > 0
                else 0
            )

            alerts = []

            if (
                lost_count >= count_threshold
                or loss_percentage >= pct_threshold
            ):
                severity = (
                    self.SEVERITY_CRITICAL
                    if loss_percentage > 20
                    else (
                        self.SEVERITY_HIGH
                        if loss_percentage > 10
                        else self.SEVERITY_MEDIUM
                    )
                )

                # Separate high-authority losses
                high_da_losses = [
                    bl
                    for bl in lost_backlinks
                    if bl.get("domain_authority", 0) >= 50
                ]

                alert = await self.create_alert(
                    client_id=client_id,
                    alert_type=self.TYPE_BACKLINK_LOSS,
                    severity=severity,
                    title=(
                        f"{lost_count} backlinks lost "
                        f"({round(loss_percentage, 1)}% decline)"
                    ),
                    details={
                        "lost_count": lost_count,
                        "loss_percentage": round(loss_percentage, 1),
                        "high_authority_losses": len(high_da_losses),
                        "previous_total": previous_count,
                        "current_total": current_count,
                    },
                )
                alerts.append(alert)

            return {
                "client_id": client_id,
                "previous_count": previous_count,
                "current_count": current_count,
                "lost_count": lost_count,
                "loss_percentage": round(loss_percentage, 1),
                "lost_backlinks": lost_backlinks[:20],
                "alerts_generated": len(alerts),
                "alerts": alerts,
                "checked_at": datetime.now(
                    timezone.utc
                ).isoformat(),
            }

        except Exception as exc:
            logger.error(
                "Error checking backlink losses for client %s: %s",
                client_id,
                str(exc),
                exc_info=True,
            )
            raise RuntimeError(
                f"Backlink loss check failed: {str(exc)}"
            ) from exc

    async def check_traffic_drops(
        self,
        client_id: str,
        thresholds: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Check for significant drops in organic traffic.

        Args:
            client_id: The client identifier.
            thresholds: Optional custom thresholds. Keys:
                        - percentage: minimum traffic drop % to alert on.
                        - sessions: minimum session drop to alert on.

        Returns:
            Dictionary with traffic drop analysis and alerts.
        """
        logger.info(
            "Checking traffic drops for client: %s", client_id
        )

        if not client_id:
            raise ValueError("client_id is required.")

        pct_threshold = (
            (thresholds or {}).get(
                "percentage",
                self.default_thresholds["traffic_drop_percentage"],
            )
        )
        sessions_threshold = (
            (thresholds or {}).get(
                "sessions",
                self.default_thresholds["traffic_drop_sessions"],
            )
        )

        try:
            # In production, fetch from analytics database.
            current_traffic = await self._get_current_traffic(
                client_id
            )
            previous_traffic = await self._get_previous_traffic(
                client_id
            )

            current_sessions = current_traffic.get(
                "organic_sessions", 0
            )
            previous_sessions = previous_traffic.get(
                "organic_sessions", 0
            )
            session_diff = previous_sessions - current_sessions
            pct_change = (
                (session_diff / previous_sessions * 100)
                if previous_sessions > 0
                else 0
            )

            alerts = []

            if (
                pct_change >= pct_threshold
                or session_diff >= sessions_threshold
            ):
                severity = (
                    self.SEVERITY_CRITICAL
                    if pct_change > 30
                    else (
                        self.SEVERITY_HIGH
                        if pct_change > 20
                        else self.SEVERITY_MEDIUM
                    )
                )

                alert = await self.create_alert(
                    client_id=client_id,
                    alert_type=self.TYPE_TRAFFIC_DROP,
                    severity=severity,
                    title=(
                        f"Organic traffic dropped {round(pct_change, 1)}% "
                        f"({session_diff} sessions)"
                    ),
                    details={
                        "previous_sessions": previous_sessions,
                        "current_sessions": current_sessions,
                        "session_difference": session_diff,
                        "percentage_drop": round(pct_change, 1),
                        "top_declined_pages": current_traffic.get(
                            "top_declined_pages", []
                        ),
                    },
                )
                alerts.append(alert)

            return {
                "client_id": client_id,
                "previous_sessions": previous_sessions,
                "current_sessions": current_sessions,
                "session_difference": session_diff,
                "percentage_change": round(pct_change, 1),
                "alerts_generated": len(alerts),
                "alerts": alerts,
                "checked_at": datetime.now(
                    timezone.utc
                ).isoformat(),
            }

        except Exception as exc:
            logger.error(
                "Error checking traffic drops for client %s: %s",
                client_id,
                str(exc),
                exc_info=True,
            )
            raise RuntimeError(
                f"Traffic drop check failed: {str(exc)}"
            ) from exc

    async def create_alert(
        self,
        client_id: str,
        alert_type: str,
        severity: str,
        title: str,
        details: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Create and persist an alert record.

        Args:
            client_id: The client identifier.
            alert_type: Type of alert (ranking_drop, backlink_loss, etc.).
            severity: Alert severity level.
            title: Human-readable alert title.
            details: Additional alert details.

        Returns:
            Dictionary with the created alert record.
        """
        logger.info(
            "Creating %s alert for client %s: %s",
            severity,
            client_id,
            title,
        )

        alert = {
            "id": str(uuid4()),
            "client_id": client_id,
            "type": alert_type,
            "severity": severity,
            "title": title,
            "details": details or {},
            "is_read": False,
            "is_resolved": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

        # In production, persist to the database and trigger
        # notification delivery (email, Slack, webhook, etc.).
        logger.debug("Alert created: id=%s", alert["id"])
        return alert

    async def run_all_checks(
        self,
        client_id: str,
        thresholds: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Run all monitoring checks for a client.

        Executes ranking drop, backlink loss, and traffic drop checks
        in sequence and returns aggregated results.

        Args:
            client_id: The client identifier.
            thresholds: Optional custom thresholds for all checks.

        Returns:
            Dictionary with results from all monitoring checks.
        """
        logger.info(
            "Running all alert checks for client: %s", client_id
        )

        if not client_id:
            raise ValueError("client_id is required.")

        results = {
            "client_id": client_id,
            "checks_run": [],
            "total_alerts": 0,
            "alerts_by_severity": {
                self.SEVERITY_CRITICAL: 0,
                self.SEVERITY_HIGH: 0,
                self.SEVERITY_MEDIUM: 0,
                self.SEVERITY_LOW: 0,
                self.SEVERITY_INFO: 0,
            },
            "all_alerts": [],
        }

        # Run each check and collect results
        checks = [
            ("ranking_drops", self.check_ranking_drops),
            ("backlink_losses", self.check_backlink_losses),
            ("traffic_drops", self.check_traffic_drops),
        ]

        for check_name, check_func in checks:
            try:
                check_result = await check_func(
                    client_id, thresholds
                )
                results["checks_run"].append(
                    {
                        "name": check_name,
                        "status": "completed",
                        "alerts_generated": check_result.get(
                            "alerts_generated", 0
                        ),
                    }
                )

                alerts = check_result.get("alerts", [])
                results["all_alerts"].extend(alerts)
                results["total_alerts"] += len(alerts)

                for alert in alerts:
                    sev = alert.get("severity", self.SEVERITY_INFO)
                    if sev in results["alerts_by_severity"]:
                        results["alerts_by_severity"][sev] += 1

            except Exception as exc:
                logger.error(
                    "Check '%s' failed for client %s: %s",
                    check_name,
                    client_id,
                    str(exc),
                )
                results["checks_run"].append(
                    {
                        "name": check_name,
                        "status": "failed",
                        "error": str(exc),
                    }
                )

        results["completed_at"] = datetime.now(
            timezone.utc
        ).isoformat()

        # Determine overall status
        critical = results["alerts_by_severity"][self.SEVERITY_CRITICAL]
        high = results["alerts_by_severity"][self.SEVERITY_HIGH]

        if critical > 0:
            results["overall_status"] = "critical"
        elif high > 0:
            results["overall_status"] = "warning"
        elif results["total_alerts"] > 0:
            results["overall_status"] = "attention"
        else:
            results["overall_status"] = "healthy"

        logger.info(
            "All checks completed for client %s: %d alerts, status=%s",
            client_id,
            results["total_alerts"],
            results["overall_status"],
        )

        return results

    def _calculate_ranking_severity(
        self, positions_dropped: int, previous_position: int
    ) -> str:
        """Determine alert severity based on ranking drop magnitude."""
        if previous_position <= 3 and positions_dropped >= 3:
            return self.SEVERITY_CRITICAL
        if previous_position <= 10 and positions_dropped >= 5:
            return self.SEVERITY_CRITICAL
        if positions_dropped >= 20:
            return self.SEVERITY_HIGH
        if positions_dropped >= 10:
            return self.SEVERITY_HIGH
        if positions_dropped >= 5:
            return self.SEVERITY_MEDIUM
        return self.SEVERITY_LOW

    # Database query stubs -- replace with actual queries in production

    async def _get_current_rankings(
        self, client_id: str
    ) -> Dict[str, int]:
        """Fetch current keyword rankings from the database."""
        logger.debug(
            "Fetching current rankings for client %s", client_id
        )
        return {}

    async def _get_previous_rankings(
        self, client_id: str
    ) -> Dict[str, int]:
        """Fetch previous keyword rankings from the database."""
        logger.debug(
            "Fetching previous rankings for client %s", client_id
        )
        return {}

    async def _get_current_backlink_count(
        self, client_id: str
    ) -> int:
        """Fetch current backlink count from the database."""
        return 0

    async def _get_previous_backlink_count(
        self, client_id: str
    ) -> int:
        """Fetch previous backlink count from the database."""
        return 0

    async def _get_lost_backlinks(
        self, client_id: str
    ) -> List[Dict[str, Any]]:
        """Fetch recently lost backlinks from the database."""
        return []

    async def _get_current_traffic(
        self, client_id: str
    ) -> Dict[str, Any]:
        """Fetch current traffic data from the database."""
        return {"organic_sessions": 0, "top_declined_pages": []}

    async def _get_previous_traffic(
        self, client_id: str
    ) -> Dict[str, Any]:
        """Fetch previous period traffic data from the database."""
        return {"organic_sessions": 0}
