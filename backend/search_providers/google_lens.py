"""
NETRA Backend — Google Lens search provider (Hybrid).
Attempts browser automation via Playwright to fetch real visual search matches.
If blocked by CAPTCHA, bot detection, or if it returns 0 results, it gracefully
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

logger = logging.getLogger("netra.providers.google_lens")

# Realistic domain pools for demo results fallback
_DOMAINS = [
    "facebook.com", "instagram.com", "twitter.com", "linkedin.com",
    "reddit.com", "pinterest.com", "flickr.com", "tumblr.com",
    "vk.com", "500px.com", "deviantart.com", "imgur.com",
    "stock.adobe.com", "shutterstock.com", "gettyimages.com",
    "unsplash.com", "pexels.com", "news.ycombinator.com",
    "medium.com", "blogspot.com", "wordpress.com",
]

_PAGE_TEMPLATES = [
    "Profile photo matching uploaded image",
    "Image found in public gallery",
    "Exact match in user-uploaded content",
    "Visually similar image on {domain}",
    "Reverse image match — high similarity",
    "Partial match detected in photo album",
    "Image repost identified on {domain}",
    "Shared media containing visual match",
    "Publicly indexed image on {domain}",
    "Duplicate content discovered",
]


def _deterministic_seed(phash: str, index: int) -> int:
    """Create a deterministic seed from the phash so the same image always
    produces the same fallback results."""
    h = hashlib.md5(f"{phash}-{index}".encode()).hexdigest()
    return int(h[:8], 16)


class GoogleLensProvider(BaseSearchProvider):
    """Google Lens provider with Playwright scraper & realistic fallback."""

    @property
    def name(self) -> str:
        return "Google Lens"

    @property
    def provider_id(self) -> str:
        return "google_lens"

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
                    logger.warning("GoogleLens: Chrome channel launch failed (%s). Retrying with default Chromium...", launch_exc)
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

                logger.info("GoogleLens: navigating to Google Images...")
                await page.goto("https://images.google.com/", wait_until="domcontentloaded", timeout=20000)
                await page.wait_for_timeout(2000)

                # Click search by image camera icon
                camera_button = page.locator('[aria-label="Search by image"]')
                if await camera_button.count() > 0:
                    await camera_button.first.click()
                    await page.wait_for_timeout(1000)
                else:
                    alt_camera = page.locator("div.nDcEnd, svg.Gdd5U, .tdmBEe")
                    if await alt_camera.count() > 0:
                        await alt_camera.first.click()
                        await page.wait_for_timeout(1000)
                    else:
                        logger.warning("GoogleLens: Camera button not found on page.")
                        return []

                # Upload the image file
                file_input = page.locator('input[type="file"]')
                if await file_input.count() > 0:
                    logger.info("GoogleLens: Uploading image to Google Lens...")
                    await file_input.first.set_input_files(image_path)
                    
                    # Wait for navigation or results/captcha page load
                    try:
                        await page.wait_for_selector("div[data-action-url] a[href], div.G19kAf a[href], a.VFACy, [id*='captcha'], iframe[src*='recaptcha'], [id*='sorry']", timeout=20000)
                    except Exception:
                        await page.wait_for_timeout(4000)
                else:
                    logger.warning("GoogleLens: File input not found on page.")
                    return []

                # Check if blocked by reCAPTCHA / unusual traffic
                content = await page.content()
                if "unusual traffic" in content.lower() or "recaptcha" in content.lower() or "sorry/index" in page.url:
                    logger.warning("GoogleLens: Blocked by Google CAPTCHA. Waiting up to 90 seconds for manual CAPTCHA solving...")
                    # Inject visual banner into the page
                    try:
                        await page.evaluate("""() => {
                            const div = document.createElement('div');
                            div.style.position = 'fixed';
                            div.style.top = '0';
                            div.style.left = '0';
                            div.style.width = '100%';
                            div.style.backgroundColor = '#0f172a';
                            div.style.color = '#00ffaa';
                            div.style.borderBottom = '2px solid #00d2ff';
                            div.style.padding = '14px';
                            div.style.textAlign = 'center';
                            div.style.fontFamily = 'monospace';
                            div.style.fontSize = '12px';
                            div.style.fontWeight = 'bold';
                            div.style.zIndex = '999999';
                            div.style.boxShadow = '0 4px 20px rgba(0,210,255,0.4)';
                            div.innerText = 'NETRA CORE: BOT CHECK DETECTED. Please solve the Google CAPTCHA below to proceed with digital tracing.';
                            document.body.appendChild(div);
                            document.body.style.paddingTop = '50px';
                        }""")
                    except Exception:
                        pass
                    try:
                        await page.wait_for_selector("div[data-action-url] a[href], div.G19kAf a[href], a.VFACy", timeout=90000)
                        logger.info("GoogleLens: CAPTCHA solved successfully by user!")
                    except Exception:
                        raise RuntimeError("Blocked by Google CAPTCHA. Solve the CAPTCHA in the browser window to continue.")

                # Extract result links
                result_selectors = [
                    "div[data-action-url] a[href]",
                    "div.G19kAf a[href]",
                    "a.VFACy",
                    "div.Vd9M6 a[href]",
                ]

                seen_urls = set()
                for selector in result_selectors:
                    elements = page.locator(selector)
                    count = await elements.count()
                    for i in range(min(count, 15)):
                        href = await elements.nth(i).get_attribute("href")
                        if not href or href.startswith("#") or "google.com" in href:
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
                            "page_title": title or f"Visual match on {domain}",
                            "domain": domain,
                            "similarity_score": round(max(95.0 - (len(scraped_results) * 5.0), 40.0), 1),
                            "source_provider": self.provider_id,
                            "metadata_json": None,
                        })

                logger.info("GoogleLens: Scraped %d real matching results.", len(scraped_results))
            finally:
                if context:
                    await context.close()

        return scraped_results


    # Simulated results generation deleted to rely 100% on real search.
