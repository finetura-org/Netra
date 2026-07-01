import os
import logging
import asyncio
from pathlib import Path
from typing import Any, Dict, List
from PIL import Image
import imagehash

from config import settings
from search_providers.base import BaseSearchProvider

logger = logging.getLogger("netra.search.database")

MOCK_DOMAINS = [
    "e-commerce-shop.com", "mybuy-store.net", "cheapretailer.org", "amazon.com",
    "boutiquebrands.com", "discountmart.xyz", "ebay.com", "trendyboutique.co",
    "globalimports.com", "aliexpress.com", "cyber-shop.net", "reddit.com",
    "gadgetWorld.net", "pinterest.com", "megamarket.biz", "instagram.com",
    "stylehub.net", "facebook.com", "thriftfinds.org", "urbanthreads.com",
    "amazon.com", "wellnessmarket.com", "vintagewarehouse.co", "ebay.com",
    "retailtherapy.org", "dealfinder.net", "activegear-outlet.com", "chicclothing.net",
    "aliexpress.com", "elitebrands.co", "metrostyle.com", "pinterest.com",
    "reddit.com", "essentialgoods.com", "finestyling.net", "shoppersparadise.org",
    "amazon.com", "firstclass-retail.com", "urbanoutfitters-fake.net", "dailynecessities.org",
    "ebay.com", "hometrends.com", "fashionforward.co", "supersavers.net",
    "treasurechest.org", "moderndwellings.com", "gourmetgrocer.net", "aliexpress.com",
    "decorstyles.org", "sportinggoods-direct.net"
]

class DatabaseVisualSearchProvider(BaseSearchProvider):
    """Search provider that scans a local directory structured as website_xxx folders."""

    @property
    def name(self) -> str:
        return "Database Search"

    @property
    def provider_id(self) -> str:
        return "database_visual"

    async def search(
        self,
        image_path: str,
        phash: str,
        description: str,
    ) -> List[Dict[str, Any]]:
        """Scans the local simulated internet database using perceptual hashing."""
        logger.info("Initializing visual search in database directory: %s", settings.DATABASE_SEARCH_DIR)

        try:
            uploaded_hash = imagehash.hex_to_hash(phash)
        except Exception as exc:
            logger.error("Failed to parse target phash hex: %s", exc)
            uploaded_hash = imagehash.phash(Image.open(image_path), hash_size=8)

        results = []
        db_dir = Path(settings.DATABASE_SEARCH_DIR)

        if not db_dir.exists():
            logger.error("Database directory %s does not exist!", db_dir)
            return []

        # List all website folders sorted (website_001, website_002, etc.)
        website_folders = sorted(
            [d for d in db_dir.iterdir() if d.is_dir() and d.name.startswith("website_")],
            key=lambda x: x.name
        )

        for idx, folder in enumerate(website_folders):
            # Map folder to mock domain name
            domain = MOCK_DOMAINS[idx % len(MOCK_DOMAINS)]

            # Check files in folder
            for file_path in folder.iterdir():
                if file_path.is_file() and file_path.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tiff"):
                    try:
                        # Process image in an executor to avoid blocking the async event loop
                        loop = asyncio.get_event_loop()
                        
                        def process_image(p):
                            with Image.open(p) as img:
                                return imagehash.phash(img, hash_size=8)
                        
                        db_hash = await loop.run_in_executor(None, process_image, file_path)
                        
                        diff = uploaded_hash - db_hash
                        similarity = (1.0 - (diff / 64.0)) * 100.0

                        # Check if similarity is above a threshold (e.g. 70.0% similarity)
                        if similarity >= 70.0:
                            logger.info("MATCH FOUND in %s: %s (Similarity: %.1f%%)", folder.name, file_path.name, similarity)
                            
                            # Add matching result
                            results.append({
                                "source_url": f"https://{domain}/products/{file_path.name}",
                                "page_title": f"Buy Online - {file_path.stem.replace('_', ' ')}",
                                "domain": domain,
                                "similarity_score": round(similarity, 1),
                                "source_provider": self.provider_id,
                                "metadata_json": f'{{"folder": "{folder.name}", "filename": "{file_path.name}"}}'
                            })
                    except Exception as e:
                        logger.warning("Error processing image %s: %s", file_path, e)

        return results
