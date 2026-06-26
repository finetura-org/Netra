"""
NETRA Backend — Abstract base class for all search providers.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, Dict, List


class BaseSearchProvider(ABC):
    """Contract that every reverse-image search provider must implement."""

    @property
    @abstractmethod
    def name(self) -> str:
        """Human-readable provider name (e.g. 'Google Lens')."""
        ...

    @property
    @abstractmethod
    def provider_id(self) -> str:
        """Machine identifier (e.g. 'google_lens')."""
        ...

    @abstractmethod
    async def search(
        self,
        image_path: str,
        phash: str,
        description: str,
    ) -> List[Dict[str, Any]]:
        """Execute a reverse-image search.

        Parameters
        ----------
        image_path:
            Absolute path to the cleaned image on disk.
        phash:
            Perceptual hash hex string of the image.
        description:
            AI-generated textual description of the image.

        Returns
        -------
        A list of result dicts, each containing at minimum:
            - source_url:  str
            - page_title:  str | None
            - domain:      str | None
            - similarity_score: float  (0–100)
        """
        ...
