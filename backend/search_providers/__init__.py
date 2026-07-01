"""
NETRA Backend — Search providers registry.
Auto-discovers and exposes all concrete search providers.
"""

from __future__ import annotations

from typing import Dict, List, Type

from search_providers.base import BaseSearchProvider
from search_providers.database_provider import DatabaseVisualSearchProvider

# ── Registry ──────────────────────────────────────────────────────────────

_PROVIDERS: Dict[str, Type[BaseSearchProvider]] = {
    "database_visual": DatabaseVisualSearchProvider,
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
