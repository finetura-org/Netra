"""
NETRA Backend — Search providers registry.
Auto-discovers and exposes all concrete search providers.
"""

from __future__ import annotations

from typing import Dict, List, Type

from search_providers.base import BaseSearchProvider
from search_providers.bing_visual_provider import BingVisualProvider
from search_providers.google_lens import GoogleLensProvider
from search_providers.tineye_provider import TinEyeProvider

# ── Registry ──────────────────────────────────────────────────────────────

_PROVIDERS: Dict[str, Type[BaseSearchProvider]] = {
    "google_lens": GoogleLensProvider,
    "tineye": TinEyeProvider,
    "bing_visual": BingVisualProvider,
}


def get_provider(name: str) -> BaseSearchProvider:
    """Return an instance of the named provider."""
    cls = _PROVIDERS.get(name)
    if cls is None:
        raise ValueError(f"Unknown search provider: {name!r}")
    return cls()


def get_all_providers() -> List[BaseSearchProvider]:
    """Return instances of every registered provider."""
    return [cls() for cls in _PROVIDERS.values()]


def list_provider_names() -> List[str]:
    """Return the names of all registered providers."""
    return list(_PROVIDERS.keys())
