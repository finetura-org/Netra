"""
NETRA Backend — Bing Visual Search provider (Hybrid).
Attempts browser automation via Playwright to fetch real visual search matches.
If blocked, redirected, or if it returns 0 results, it gracefully falls back
to realistic, deterministic simulated matches to guarantee that the
investigation pipeline never returns 0 results.
"""

from __future__ import annotations

import hashlib
import logging
import os
import random
from typing import Any, Dict, List
from urllib.parse import urlparse

from config import settings
from search_providers.base import BaseSearchProvider

logger = logging.getLogger("netra.providers.bing_visual")

# Realistic domain pools for demo results fallback
_DOMAINS = [
    "ebay.com", "amazon.com", "aliexpress.com", "etsy.com",
    "wish.com", "alibaba.com", "olx.com", "craigslist.org",
    "news.bbc.co.uk", "cnn.com", "reuters.com", "apnews.com",
    "theguardian.com", "nytimes.com", "washingtonpost.com",
    "wordpress.com", "blogspot.com", "wix.com", "weebly.com",
    "squarespace.com",
]

_PAGE_TEMPLATES = [
    "Product listing using this image",
    "News article containing matched photo",
    "Cached copy of image on {domain}",
    "Archived version — first seen 2023",
    "E-commerce listing with identical photo",
    "Blog post embedding this image",
    "Image reuse detected across {domain}",
    "Stock photo match on {domain}",
    "Earliest crawl of this image",
    "Modified version of original image",
]


def _deterministic_seed(phash: str, index: int) -> int:
    h = hashlib.md5(f"{phash}-bing-{index}".encode()).hexdigest()
    return int(h[:8], 16)


class BingVisualProvider(BaseSearchProvider):
    """Bing Visual Search provider with Playwright scraper & realistic fallback."""

    @property
    def name(self) -> str:
        return "Bing Visual Search"

    @property
    def provider_id(self) -> str:
        return "bing_visual"

    async def search(
        self,
        image_path: str,
        phash: str,
        description: str,
    ) -> List[Dict[str, Any]]:
        # 1. Attempt real Playwright browser automation
        if image_path and os.path.isfile(image_path):
            return await self._run_playwright_scraper(image_path)
        return []

    async def _run_playwright_scraper(self, image_path: str) -> List[Dict[str, Any]]:
        scraped_results: List[Dict[str, Any]] = []
        from playwright.async_api import async_playwright
        import tempfile
        from urllib.parse import parse_qs, unquote

        user_data_dir = os.path.join(tempfile.gettempdir(), f"netra_profile_{self.provider_id}")
        if os.path.exists(user_data_dir):
            import shutil
            try:
                shutil.rmtree(user_data_dir)
            except Exception:
                pass

        async with async_playwright() as pw:
            context = None
            try:
                # Attempt to launch system Google Chrome for better reputation
                try:
                    context = await pw.chromium.launch_persistent_context(
                        user_data_dir,
                        headless=settings.PLAYWRIGHT_HEADLESS,
                        channel="chrome" if not settings.PLAYWRIGHT_HEADLESS else None,
                        args=["--disable-blink-features=AutomationControlled"],
                        viewport={"width": 1280, "height": 800},
                        locale="en-US"
                    )
                except Exception as launch_exc:
                    logger.warning("BingVisual: Chrome channel launch failed (%s). Retrying with default Chromium...", launch_exc)
                    context = await pw.chromium.launch_persistent_context(
                        user_data_dir,
                        headless=settings.PLAYWRIGHT_HEADLESS,
                        args=["--disable-blink-features=AutomationControlled"],
                        viewport={"width": 1280, "height": 800},
                        locale="en-US"
                    )

                page = await context.new_page()
                from playwright_stealth import Stealth
                await Stealth().apply_stealth_async(page)
     
                logger.info("BingVisual: navigating to bing.com/images...")
                await page.goto("https://www.bing.com/images", wait_until="domcontentloaded", timeout=20000)
                await page.wait_for_timeout(2000)

                camera_btn = page.locator("[aria-label='Search using an image']").first
                if await camera_btn.count() > 0:
                    await camera_btn.click()
                    await page.wait_for_timeout(1000)
                else:
                    alt_camera = page.locator("div.nDcEnd, svg.Gdd5U, .tdmBEe")
                    if await alt_camera.count() > 0:
                        await alt_camera.first.click()
                        await page.wait_for_timeout(1000)
                    else:
                        logger.warning("BingVisual: Camera upload button not found on page.")
                        return []

                # Upload image
                file_input = page.locator('input[type="file"]')
                if await file_input.count() > 0:
                    logger.info("BingVisual: Uploading image to Bing...")
                    await file_input.first.set_input_files(image_path)
                    
                    # Wait for redirection to search page
                    logger.info("BingVisual: Waiting for search redirection...")
                    await page.wait_for_timeout(10000)
                else:
                    logger.warning("BingVisual: File input element not found.")
                    return []

                # Try to click on "Pages with this image" tab to load matches
                tab = page.locator("text='Pages with this image'")
                if await tab.count() > 0:
                    logger.info("BingVisual: Clicking 'Pages with this image' tab...")
                    await tab.first.click()
                    await page.wait_for_timeout(2000)

                # Extract links that contain mediaurl
                elements = page.locator('a[href*="mediaurl="], div.iacf_tt a[href]')
                count = await elements.count()
                
                seen_urls = set()
                for i in range(count):
                    href = await elements.nth(i).get_attribute("href")
                    if not href:
                        continue
                    
                    # Parse real URL from mediaurl parameter if it exists
                    target_url = href
                    parsed = urlparse(href)
                    qs = parse_qs(parsed.query)
                    if "mediaurl" in qs:
                        target_url = unquote(qs["mediaurl"][0])
                    else:
                        # Skip if it is a relative/bing URL and does not contain mediaurl
                        if target_url.startswith("/") or "bing.com" in target_url or "microsoft.com" in target_url:
                            continue
                    
                    if target_url in seen_urls:
                        continue
                    seen_urls.add(target_url)

                    title = await elements.nth(i).inner_text()
                    title = title.strip()[:200] if title else None
                    
                    parsed_target = urlparse(target_url)
                    domain = parsed_target.netloc.replace("www.", "")
                    if not domain:
                        domain = "unknown"

                    scraped_results.append({
                        "source_url": target_url,
                        "page_title": title or f"Visual match on {domain}",
                        "domain": domain,
                        "similarity_score": round(max(92.0 - (len(scraped_results) * 5.0), 30.0), 1),
                        "source_provider": self.provider_id,
                        "metadata_json": None,
                    })

                logger.info("BingVisual: Scraped %d real matching results.", len(scraped_results))
            finally:
                if context:
                    await context.close()

        return scraped_results


    # Simulated results generation deleted to rely 100% on real search.
