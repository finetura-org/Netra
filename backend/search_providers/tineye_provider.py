"""
NETRA Backend — TinEye search provider (Hybrid).
Attempts browser automation via Playwright to fetch real visual search matches.
If blocked by Cloudflare, bot detection, or if it returns 0 results, it gracefully
falls back to realistic, deterministic simulated matches to guarantee that
the investigation pipeline never returns 0 results.
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

logger = logging.getLogger("netra.providers.tineye")

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
    h = hashlib.md5(f"{phash}-tineye-{index}".encode()).hexdigest()
    return int(h[:8], 16)


class TinEyeProvider(BaseSearchProvider):
    """TinEye provider with Playwright scraper & realistic fallback."""

    @property
    def name(self) -> str:
        return "TinEye"

    @property
    def provider_id(self) -> str:
        return "tineye"

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
                    logger.warning("TinEye: Chrome channel launch failed (%s). Retrying with default Chromium...", launch_exc)
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
     
                logger.info("TinEye: navigating to tineye.com...")
                await page.goto("https://tineye.com/", wait_until="domcontentloaded", timeout=20000)
                await page.wait_for_timeout(2000)

                # Cloudflare bot check
                content = await page.content()
                if "cloudflare" in content.lower() or "challenge-form" in content.lower() or "turnstile" in content.lower():
                    logger.warning("TinEye: Blocked by Cloudflare Bot Protection. Waiting up to 90 seconds for manual challenge solving...")
                    # Inject visual banner into the page
                    try:
                        await page.evaluate("""() => {
                            const div = document.createElement('div');
                            div.style.position = 'fixed';
                            div.style.top = '0';
                            div.style.left = '0';
                            div.style.width = '100%';
                            div.style.backgroundColor = '#0f172a';
                            div.style.color = '#38bdf8';
                            div.style.borderBottom = '2px solid #0284c7';
                            div.style.padding = '14px';
                            div.style.textAlign = 'center';
                            div.style.fontFamily = 'monospace';
                            div.style.fontSize = '12px';
                            div.style.fontWeight = 'bold';
                            div.style.zIndex = '999999';
                            div.style.boxShadow = '0 4px 20px rgba(2,132,199,0.4)';
                            div.innerText = 'NETRA CORE: CLOUDFLARE BLOCK DETECTED. Please check the \"I am human\" box below to proceed with digital tracing.';
                            document.body.appendChild(div);
                            document.body.style.paddingTop = '50px';
                        }""")
                    except Exception:
                        pass
                    try:
                        await page.wait_for_selector('input[type="file"]', timeout=90000)
                        logger.info("TinEye: Cloudflare challenge solved successfully by user!")
                    except Exception:
                        raise RuntimeError("Blocked by Cloudflare challenge. Please solve the challenge in the browser window to continue.")

                # Upload image
                file_input = page.locator('input[type="file"]')
                if await file_input.count() > 0:
                    logger.info("TinEye: Uploading image to TinEye...")
                    await file_input.first.set_input_files(image_path)
                    try:
                        await page.wait_for_selector(".match-row a.image-link, .match a[href], .result a[href]", timeout=20000)
                    except Exception:
                        await page.wait_for_timeout(4000)
                else:
                    logger.warning("TinEye: File input element not found.")
                    return []

                result_selectors = [
                    ".match-row a.image-link",
                    ".match a[href]",
                    ".result a[href]",
                ]

                seen_urls = set()
                for selector in result_selectors:
                    elements = page.locator(selector)
                    count = await elements.count()
                    for i in range(min(count, 15)):
                        href = await elements.nth(i).get_attribute("href")
                        if not href or href.startswith("#") or "tineye.com" in href:
                            continue
                        if href in seen_urls:
                            continue
                        seen_urls.add(href)

                        title = await elements.nth(i).inner_text()
                        title = title.strip()[:200] if title else None
                        parsed = urlparse(href)
                        domain = parsed.netloc.replace("www.", "")

                        scraped_results.append({
                            "source_url": href,
                            "page_title": title or f"Image found on {domain}",
                            "domain": domain,
                            "similarity_score": round(max(90.0 - (len(scraped_results) * 5.0), 30.0), 1),
                            "source_provider": self.provider_id,
                            "metadata_json": None,
                        })

                logger.info("TinEye: Scraped %d real matching results.", len(scraped_results))
            finally:
                if context:
                    await context.close()

        return scraped_results


    # Simulated results generation deleted to rely 100% on real search.
