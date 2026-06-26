"""
NETRA Backend — Image processing utilities.
EXIF stripping, perceptual hashing, metadata extraction, and
AI-powered image description via Groq vision.
"""

from __future__ import annotations

import base64
import io
import logging
from typing import Any, Dict

import imagehash
from PIL import Image, ExifTags

from groq_client import groq_client

logger = logging.getLogger("netra.image")


class ImageProcessor:
    """Stateless helper for all image-processing operations."""

    # ── EXIF stripping ────────────────────────────────────────────────────

    @staticmethod
    def strip_exif(image_bytes: bytes) -> bytes:
        """Remove all EXIF metadata from *image_bytes* and return clean bytes (PNG or JPEG)."""
        img = Image.open(io.BytesIO(image_bytes))
        
        # Determine output format and mode
        if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
            out_format = "PNG"
            clean_mode = "RGBA"
        else:
            out_format = "JPEG"
            clean_mode = "RGB"

        # Create a brand-new image without metadata
        clean = Image.new(clean_mode, img.size)
        clean.paste(img)

        buf = io.BytesIO()
        clean.save(buf, format=out_format, quality=95)
        buf.seek(0)
        return buf.read()


    # ── Perceptual hash ───────────────────────────────────────────────────

    @staticmethod
    def generate_phash(image_bytes: bytes) -> str:
        """Compute a 64-bit perceptual hash and return it as a hex string."""
        img = Image.open(io.BytesIO(image_bytes))
        phash = imagehash.phash(img, hash_size=8)
        return str(phash)

    # ── Metadata extraction ───────────────────────────────────────────────

    @staticmethod
    def get_image_metadata(image_bytes: bytes) -> Dict[str, Any]:
        """Extract useful metadata from the raw image bytes."""
        img = Image.open(io.BytesIO(image_bytes))
        meta: Dict[str, Any] = {
            "format": img.format,
            "mode": img.mode,
            "width": img.width,
            "height": img.height,
            "size_bytes": len(image_bytes),
        }

        # Attempt to read EXIF
        exif_data = img.getexif()
        if exif_data:
            readable_exif: Dict[str, str] = {}
            for tag_id, value in exif_data.items():
                tag_name = ExifTags.TAGS.get(tag_id, str(tag_id))
                try:
                    readable_exif[tag_name] = str(value)
                except Exception:
                    readable_exif[tag_name] = "<unreadable>"
            meta["exif"] = readable_exif
        else:
            meta["exif"] = {}

        return meta

    # ── AI-powered description ────────────────────────────────────────────

    @staticmethod
    async def generate_embedding_description(image_bytes: bytes) -> str:
        """Use Groq vision to produce a textual description of the image.

        Falls back to a basic metadata-based description on failure.
        """
        try:
            b64 = base64.b64encode(image_bytes).decode("utf-8")
            description = await groq_client.describe_image(b64)
            return description
        except Exception as exc:
            logger.warning("Vision description failed: %s — using fallback.", exc)
            # Fallback: basic metadata description
            img = Image.open(io.BytesIO(image_bytes))
            return (
                f"Image with dimensions {img.width}×{img.height}, "
                f"format {img.format or 'unknown'}, mode {img.mode}."
            )


# ── Module-level singleton ────────────────────────────────────────────────

image_processor = ImageProcessor()
