"""
SEO Crawler Service

Provides website crawling, Core Web Vitals analysis, mobile SEO checks,
SEO scoring, and health report generation.
"""

import asyncio
import logging
import time
from typing import Any, Dict, List, Optional
from urllib.parse import urljoin, urlparse

import aiohttp
from bs4 import BeautifulSoup

from core.config import settings

logger = logging.getLogger(__name__)


class SEOCrawlerService:
    """Service for crawling websites and performing SEO audits."""

    def __init__(self):
        self.session: Optional[aiohttp.ClientSession] = None
        self.user_agent = (
            "Mozilla/5.0 (compatible; SEOCrawlerBot/1.0; "
            "+https://seocrawler.example.com)"
        )
        self.max_concurrent_requests = 10
        self.request_timeout = aiohttp.ClientTimeout(total=30)

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

    async def crawl_website(
        self, url: str, depth: int = 3
    ) -> Dict[str, Any]:
        """
        Crawl a website up to a specified depth and collect SEO-relevant data.

        Args:
            url: The starting URL to crawl.
            depth: Maximum crawl depth (default 3).

        Returns:
            Dictionary containing crawled pages, metadata, links, and issues.
        """
        logger.info("Starting crawl of %s with depth %d", url, depth)
        visited: set = set()
        pages: List[Dict[str, Any]] = []
        issues: List[Dict[str, Any]] = []
        queue: List[tuple] = [(url, 0)]
        semaphore = asyncio.Semaphore(self.max_concurrent_requests)
        base_domain = urlparse(url).netloc

        async def _fetch_page(page_url: str, current_depth: int):
            if page_url in visited or current_depth > depth:
                return
            visited.add(page_url)

            async with semaphore:
                try:
                    session = await self._get_session()
                    start_time = time.monotonic()
                    async with session.get(page_url) as response:
                        load_time = time.monotonic() - start_time
                        status_code = response.status
                        content_type = response.headers.get(
                            "Content-Type", ""
                        )

                        if "text/html" not in content_type:
                            logger.debug(
                                "Skipping non-HTML resource: %s", page_url
                            )
                            return

                        html = await response.text()
                        soup = BeautifulSoup(html, "html.parser")
                        page_data = self._extract_page_data(
                            soup, page_url, status_code, load_time
                        )
                        pages.append(page_data)

                        # Collect page-level issues
                        page_issues = self._detect_page_issues(
                            page_data, page_url
                        )
                        issues.extend(page_issues)

                        # Extract internal links for further crawling
                        if current_depth < depth:
                            links = soup.find_all("a", href=True)
                            for link in links:
                                href = urljoin(page_url, link["href"])
                                parsed = urlparse(href)
                                # Only follow internal links
                                if (
                                    parsed.netloc == base_domain
                                    and href not in visited
                                    and parsed.scheme in ("http", "https")
                                ):
                                    queue.append((href, current_depth + 1))

                except aiohttp.ClientError as exc:
                    logger.warning(
                        "HTTP error crawling %s: %s", page_url, str(exc)
                    )
                    issues.append(
                        {
                            "url": page_url,
                            "type": "crawl_error",
                            "severity": "high",
                            "message": f"Failed to fetch page: {str(exc)}",
                        }
                    )
                except Exception as exc:
                    logger.error(
                        "Unexpected error crawling %s: %s",
                        page_url,
                        str(exc),
                        exc_info=True,
                    )

        # BFS crawl
        while queue:
            batch = queue[:]
            queue.clear()
            tasks = [_fetch_page(u, d) for u, d in batch]
            await asyncio.gather(*tasks)

        logger.info(
            "Crawl completed: %d pages crawled, %d issues found",
            len(pages),
            len(issues),
        )
        return {
            "url": url,
            "pages_crawled": len(pages),
            "pages": pages,
            "issues": issues,
            "internal_links_count": sum(
                p.get("internal_links", 0) for p in pages
            ),
            "external_links_count": sum(
                p.get("external_links", 0) for p in pages
            ),
        }

    def _extract_page_data(
        self,
        soup: BeautifulSoup,
        url: str,
        status_code: int,
        load_time: float,
    ) -> Dict[str, Any]:
        """Extract SEO-relevant data from a parsed HTML page."""
        title_tag = soup.find("title")
        title = title_tag.get_text(strip=True) if title_tag else None

        meta_desc_tag = soup.find("meta", attrs={"name": "description"})
        meta_description = (
            meta_desc_tag.get("content", "").strip() if meta_desc_tag else None
        )

        meta_robots_tag = soup.find("meta", attrs={"name": "robots"})
        meta_robots = (
            meta_robots_tag.get("content", "").strip()
            if meta_robots_tag
            else None
        )

        canonical_tag = soup.find("link", attrs={"rel": "canonical"})
        canonical = (
            canonical_tag.get("href", "").strip() if canonical_tag else None
        )

        headings = {}
        for level in range(1, 7):
            tags = soup.find_all(f"h{level}")
            if tags:
                headings[f"h{level}"] = [
                    t.get_text(strip=True) for t in tags
                ]

        images = soup.find_all("img")
        images_without_alt = [
            img.get("src", "unknown")
            for img in images
            if not img.get("alt")
        ]

        base_domain = urlparse(url).netloc
        all_links = soup.find_all("a", href=True)
        internal_links = 0
        external_links = 0
        for link in all_links:
            href = urljoin(url, link["href"])
            if urlparse(href).netloc == base_domain:
                internal_links += 1
            else:
                external_links += 1

        word_count = len(soup.get_text(separator=" ", strip=True).split())

        return {
            "url": url,
            "status_code": status_code,
            "load_time_seconds": round(load_time, 3),
            "title": title,
            "title_length": len(title) if title else 0,
            "meta_description": meta_description,
            "meta_description_length": (
                len(meta_description) if meta_description else 0
            ),
            "meta_robots": meta_robots,
            "canonical": canonical,
            "headings": headings,
            "h1_count": len(headings.get("h1", [])),
            "images_total": len(images),
            "images_without_alt": len(images_without_alt),
            "images_without_alt_srcs": images_without_alt[:10],
            "internal_links": internal_links,
            "external_links": external_links,
            "word_count": word_count,
        }

    def _detect_page_issues(
        self, page_data: Dict[str, Any], url: str
    ) -> List[Dict[str, Any]]:
        """Detect common SEO issues on a single page."""
        issues = []

        if not page_data.get("title"):
            issues.append(
                {
                    "url": url,
                    "type": "missing_title",
                    "severity": "high",
                    "message": "Page is missing a <title> tag.",
                }
            )
        elif page_data["title_length"] > 60:
            issues.append(
                {
                    "url": url,
                    "type": "title_too_long",
                    "severity": "medium",
                    "message": (
                        f"Title tag is {page_data['title_length']} chars "
                        f"(recommended: <= 60)."
                    ),
                }
            )

        if not page_data.get("meta_description"):
            issues.append(
                {
                    "url": url,
                    "type": "missing_meta_description",
                    "severity": "high",
                    "message": "Page is missing a meta description.",
                }
            )
        elif page_data["meta_description_length"] > 160:
            issues.append(
                {
                    "url": url,
                    "type": "meta_description_too_long",
                    "severity": "medium",
                    "message": (
                        f"Meta description is "
                        f"{page_data['meta_description_length']} chars "
                        f"(recommended: <= 160)."
                    ),
                }
            )

        if page_data.get("h1_count", 0) == 0:
            issues.append(
                {
                    "url": url,
                    "type": "missing_h1",
                    "severity": "high",
                    "message": "Page has no H1 heading.",
                }
            )
        elif page_data["h1_count"] > 1:
            issues.append(
                {
                    "url": url,
                    "type": "multiple_h1",
                    "severity": "medium",
                    "message": (
                        f"Page has {page_data['h1_count']} H1 headings "
                        f"(recommended: 1)."
                    ),
                }
            )

        if page_data.get("images_without_alt", 0) > 0:
            issues.append(
                {
                    "url": url,
                    "type": "images_missing_alt",
                    "severity": "medium",
                    "message": (
                        f"{page_data['images_without_alt']} image(s) "
                        f"missing alt attributes."
                    ),
                }
            )

        if page_data.get("load_time_seconds", 0) > 3.0:
            issues.append(
                {
                    "url": url,
                    "type": "slow_page",
                    "severity": "high",
                    "message": (
                        f"Page load time is "
                        f"{page_data['load_time_seconds']}s "
                        f"(recommended: < 3s)."
                    ),
                }
            )

        if page_data.get("word_count", 0) < 300:
            issues.append(
                {
                    "url": url,
                    "type": "thin_content",
                    "severity": "medium",
                    "message": (
                        f"Page has only {page_data['word_count']} words "
                        f"(recommended: >= 300)."
                    ),
                }
            )

        return issues

    async def analyze_core_web_vitals(self, url: str) -> Dict[str, Any]:
        """
        Analyze Core Web Vitals for a given URL using the PageSpeed
        Insights API.

        Args:
            url: The URL to analyze.

        Returns:
            Dictionary with LCP, FID, CLS scores and diagnostics.
        """
        logger.info("Analyzing Core Web Vitals for %s", url)
        api_key = getattr(settings, "PAGESPEED_API_KEY", None)
        api_url = (
            "https://www.googleapis.com/pagespeedonline/v5/runPagespeed"
        )
        params = {
            "url": url,
            "strategy": "mobile",
            "category": ["performance", "accessibility", "seo"],
        }
        if api_key:
            params["key"] = api_key

        try:
            session = await self._get_session()
            async with session.get(api_url, params=params) as response:
                if response.status != 200:
                    error_text = await response.text()
                    logger.error(
                        "PageSpeed API error (%d): %s",
                        response.status,
                        error_text,
                    )
                    return {
                        "url": url,
                        "error": f"API returned status {response.status}",
                    }

                data = await response.json()
                loading_exp = (
                    data.get("loadingExperience", {})
                    .get("metrics", {})
                )
                lighthouse = data.get("lighthouseResult", {})
                audits = lighthouse.get("audits", {})
                categories = lighthouse.get("categories", {})

                lcp = loading_exp.get(
                    "LARGEST_CONTENTFUL_PAINT_MS", {}
                ).get("percentile")
                fid = loading_exp.get(
                    "FIRST_INPUT_DELAY_MS", {}
                ).get("percentile")
                cls_val = loading_exp.get(
                    "CUMULATIVE_LAYOUT_SHIFT_SCORE", {}
                ).get("percentile")

                return {
                    "url": url,
                    "core_web_vitals": {
                        "largest_contentful_paint_ms": lcp,
                        "first_input_delay_ms": fid,
                        "cumulative_layout_shift": (
                            cls_val / 100 if cls_val else None
                        ),
                    },
                    "performance_score": (
                        categories.get("performance", {}).get("score")
                    ),
                    "accessibility_score": (
                        categories.get("accessibility", {}).get("score")
                    ),
                    "seo_score": (
                        categories.get("seo", {}).get("score")
                    ),
                    "diagnostics": {
                        "first_contentful_paint": (
                            audits.get("first-contentful-paint", {})
                            .get("displayValue")
                        ),
                        "speed_index": (
                            audits.get("speed-index", {})
                            .get("displayValue")
                        ),
                        "time_to_interactive": (
                            audits.get("interactive", {})
                            .get("displayValue")
                        ),
                        "total_blocking_time": (
                            audits.get("total-blocking-time", {})
                            .get("displayValue")
                        ),
                    },
                }

        except aiohttp.ClientError as exc:
            logger.error(
                "Network error analyzing Core Web Vitals for %s: %s",
                url,
                str(exc),
            )
            return {"url": url, "error": f"Network error: {str(exc)}"}
        except Exception as exc:
            logger.error(
                "Unexpected error analyzing Core Web Vitals for %s: %s",
                url,
                str(exc),
                exc_info=True,
            )
            return {"url": url, "error": f"Unexpected error: {str(exc)}"}

    async def check_mobile_seo(self, url: str) -> Dict[str, Any]:
        """
        Check mobile-friendliness and mobile SEO factors for a URL.

        Args:
            url: The URL to check.

        Returns:
            Dictionary with mobile SEO analysis results.
        """
        logger.info("Checking mobile SEO for %s", url)
        mobile_user_agent = (
            "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) "
            "AppleWebKit/605.1.15 (KHTML, like Gecko) "
            "Version/16.0 Mobile/15E148 Safari/604.1"
        )

        try:
            session = await self._get_session()
            headers = {"User-Agent": mobile_user_agent}
            start_time = time.monotonic()

            async with session.get(url, headers=headers) as response:
                load_time = time.monotonic() - start_time
                html = await response.text()
                soup = BeautifulSoup(html, "html.parser")

                viewport_tag = soup.find(
                    "meta", attrs={"name": "viewport"}
                )
                has_viewport = viewport_tag is not None
                viewport_content = (
                    viewport_tag.get("content", "") if viewport_tag else ""
                )

                # Check for mobile-unfriendly elements
                flash_objects = soup.find_all(
                    ["object", "embed"],
                    attrs={"type": lambda t: t and "flash" in t.lower()}
                    if True
                    else {},
                )
                has_flash = len(flash_objects) > 0

                # Check font sizes in inline styles
                small_text_elements = soup.find_all(
                    style=lambda s: s and "font-size" in s
                )

                # Check tap targets (links/buttons too close together)
                links = soup.find_all("a")
                buttons = soup.find_all("button")
                tap_targets_count = len(links) + len(buttons)

                # Check for responsive images
                images = soup.find_all("img")
                responsive_images = [
                    img
                    for img in images
                    if img.get("srcset") or img.get("sizes")
                ]

                issues = []
                if not has_viewport:
                    issues.append(
                        {
                            "type": "missing_viewport",
                            "severity": "high",
                            "message": "Page is missing a viewport meta tag.",
                        }
                    )
                elif "width=device-width" not in viewport_content:
                    issues.append(
                        {
                            "type": "improper_viewport",
                            "severity": "medium",
                            "message": (
                                "Viewport meta tag does not include "
                                "width=device-width."
                            ),
                        }
                    )

                if has_flash:
                    issues.append(
                        {
                            "type": "flash_content",
                            "severity": "high",
                            "message": (
                                "Page contains Flash content, which is not "
                                "supported on mobile devices."
                            ),
                        }
                    )

                if load_time > 3.0:
                    issues.append(
                        {
                            "type": "slow_mobile_load",
                            "severity": "high",
                            "message": (
                                f"Mobile page load time is "
                                f"{round(load_time, 2)}s "
                                f"(recommended: < 3s)."
                            ),
                        }
                    )

                return {
                    "url": url,
                    "mobile_friendly": (
                        has_viewport and not has_flash and load_time <= 3.0
                    ),
                    "has_viewport_meta": has_viewport,
                    "viewport_content": viewport_content,
                    "mobile_load_time_seconds": round(load_time, 3),
                    "has_flash": has_flash,
                    "tap_targets_count": tap_targets_count,
                    "total_images": len(images),
                    "responsive_images": len(responsive_images),
                    "issues": issues,
                }

        except aiohttp.ClientError as exc:
            logger.error(
                "Network error checking mobile SEO for %s: %s",
                url,
                str(exc),
            )
            return {"url": url, "error": f"Network error: {str(exc)}"}
        except Exception as exc:
            logger.error(
                "Unexpected error checking mobile SEO for %s: %s",
                url,
                str(exc),
                exc_info=True,
            )
            return {"url": url, "error": f"Unexpected error: {str(exc)}"}

    async def calculate_seo_score(
        self, audit_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Calculate an overall SEO score based on audit data.

        Args:
            audit_data: Dictionary containing crawl results, web vitals,
                        and mobile SEO data.

        Returns:
            Dictionary with overall score, category scores, and breakdown.
        """
        logger.info("Calculating SEO score")

        scores = {
            "on_page": 100,
            "technical": 100,
            "content": 100,
            "mobile": 100,
            "performance": 100,
        }

        pages = audit_data.get("pages", [])
        issues = audit_data.get("issues", [])

        # Penalize for on-page issues
        severity_penalties = {"high": 10, "medium": 5, "low": 2}
        on_page_issue_types = {
            "missing_title",
            "title_too_long",
            "missing_meta_description",
            "meta_description_too_long",
            "missing_h1",
            "multiple_h1",
            "images_missing_alt",
        }
        technical_issue_types = {"crawl_error", "slow_page"}
        content_issue_types = {"thin_content"}

        # Penalties were calibrated against a handful of pages. Without
        # normalizing by page count, any real multi-page crawl racks up
        # enough issue instances to floor every category at 0 — scale the
        # per-issue penalty down as the crawled page count grows so a
        # 100-page site isn't penalized 20x harder than a 5-page one for
        # the same rate of affected pages.
        page_count = max(len(pages), 1)
        penalty_scale = 5 / page_count

        for issue in issues:
            penalty = severity_penalties.get(
                issue.get("severity", "low"), 2
            ) * penalty_scale
            issue_type = issue.get("type", "")

            if issue_type in on_page_issue_types:
                scores["on_page"] = max(0, scores["on_page"] - penalty)
            elif issue_type in technical_issue_types:
                scores["technical"] = max(
                    0, scores["technical"] - penalty
                )
            elif issue_type in content_issue_types:
                scores["content"] = max(0, scores["content"] - penalty)

        # Mobile score from mobile data
        mobile_data = audit_data.get("mobile_seo", {})
        if mobile_data:
            if not mobile_data.get("mobile_friendly", True):
                scores["mobile"] -= 30
            mobile_issues = mobile_data.get("issues", [])
            for issue in mobile_issues:
                penalty = severity_penalties.get(
                    issue.get("severity", "low"), 2
                )
                scores["mobile"] = max(0, scores["mobile"] - penalty)

        # Performance score from web vitals
        web_vitals = audit_data.get("core_web_vitals", {})
        if web_vitals:
            cwv = web_vitals.get("core_web_vitals", {})
            lcp = cwv.get("largest_contentful_paint_ms")
            if lcp and lcp > 2500:
                scores["performance"] -= 15
            if lcp and lcp > 4000:
                scores["performance"] -= 15

        # Ensure all scores are in 0-100 range
        for key in scores:
            scores[key] = max(0, min(100, scores[key]))

        # Weighted overall score
        weights = {
            "on_page": 0.30,
            "technical": 0.25,
            "content": 0.20,
            "mobile": 0.15,
            "performance": 0.10,
        }
        overall = sum(scores[k] * weights[k] for k in scores)

        grade_thresholds = [
            (90, "A"),
            (80, "B"),
            (70, "C"),
            (60, "D"),
            (0, "F"),
        ]
        grade = "F"
        for threshold, letter in grade_thresholds:
            if overall >= threshold:
                grade = letter
                break

        return {
            "overall_score": round(overall, 1),
            "grade": grade,
            "category_scores": scores,
            "weights": weights,
            "total_issues": len(issues),
            "high_severity_issues": sum(
                1 for i in issues if i.get("severity") == "high"
            ),
            "medium_severity_issues": sum(
                1 for i in issues if i.get("severity") == "medium"
            ),
        }

    async def generate_health_report(
        self, audit_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate a comprehensive SEO health report from audit data.

        Args:
            audit_data: Full audit data including crawl results, web vitals,
                        and mobile analysis.

        Returns:
            Structured health report dictionary.
        """
        logger.info("Generating SEO health report")

        seo_score = await self.calculate_seo_score(audit_data)

        pages = audit_data.get("pages", [])
        issues = audit_data.get("issues", [])

        # Group issues by type
        issues_by_type: Dict[str, List] = {}
        for issue in issues:
            issue_type = issue.get("type", "unknown")
            issues_by_type.setdefault(issue_type, []).append(issue)

        # Build recommendations
        recommendations = []
        priority_order = ["high", "medium", "low"]
        seen_types = set()
        for severity in priority_order:
            for issue in issues:
                itype = issue.get("type", "")
                if (
                    issue.get("severity") == severity
                    and itype not in seen_types
                ):
                    seen_types.add(itype)
                    recommendations.append(
                        {
                            "priority": severity,
                            "issue_type": itype,
                            "affected_pages": len(
                                issues_by_type.get(itype, [])
                            ),
                            "recommendation": self._get_recommendation(
                                itype
                            ),
                        }
                    )

        avg_load_time = 0.0
        if pages:
            load_times = [
                p.get("load_time_seconds", 0) for p in pages
            ]
            avg_load_time = round(
                sum(load_times) / len(load_times), 3
            )

        return {
            "summary": {
                "overall_score": seo_score["overall_score"],
                "grade": seo_score["grade"],
                "pages_crawled": len(pages),
                "total_issues": len(issues),
                "critical_issues": seo_score["high_severity_issues"],
            },
            "scores": seo_score,
            "performance": {
                "average_load_time_seconds": avg_load_time,
                "core_web_vitals": audit_data.get(
                    "core_web_vitals", {}
                ),
            },
            "mobile": audit_data.get("mobile_seo", {}),
            "issues_breakdown": {
                itype: {
                    "count": len(ilist),
                    "severity": ilist[0].get("severity", "unknown"),
                    "sample_urls": [
                        i.get("url", "") for i in ilist[:5]
                    ],
                }
                for itype, ilist in issues_by_type.items()
            },
            "recommendations": recommendations,
        }

    @staticmethod
    def _get_recommendation(issue_type: str) -> str:
        """Return a human-readable recommendation for a given issue type."""
        recommendations = {
            "missing_title": (
                "Add unique, descriptive <title> tags to all pages. "
                "Keep them under 60 characters."
            ),
            "title_too_long": (
                "Shorten title tags to 60 characters or fewer to avoid "
                "truncation in search results."
            ),
            "missing_meta_description": (
                "Add compelling meta descriptions to all pages. "
                "Keep them between 120-160 characters."
            ),
            "meta_description_too_long": (
                "Shorten meta descriptions to 160 characters or fewer."
            ),
            "missing_h1": (
                "Add a single, descriptive H1 heading to each page."
            ),
            "multiple_h1": (
                "Use only one H1 heading per page. Use H2-H6 for "
                "sub-sections."
            ),
            "images_missing_alt": (
                "Add descriptive alt attributes to all images for "
                "accessibility and SEO."
            ),
            "slow_page": (
                "Optimize page load times by compressing images, "
                "minifying CSS/JS, and leveraging browser caching."
            ),
            "thin_content": (
                "Expand thin pages with valuable, original content. "
                "Aim for at least 300 words per page."
            ),
            "crawl_error": (
                "Fix crawl errors by checking server configuration "
                "and ensuring all internal links are valid."
            ),
            "missing_viewport": (
                "Add a viewport meta tag to ensure proper rendering "
                "on mobile devices."
            ),
            "flash_content": (
                "Remove Flash content and replace with modern HTML5 "
                "alternatives."
            ),
        }
        return recommendations.get(
            issue_type,
            "Review and address this issue to improve your SEO.",
        )
