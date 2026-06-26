"""
NETRA Backend — Groq LLM client.
Wraps the Groq SDK with automatic key rotation and model fallback.
"""

from __future__ import annotations

import base64
import logging
from typing import Any, Dict, List, Optional

from groq import AsyncGroq, APIError, RateLimitError, APIConnectionError

from config import key_rotator, settings

logger = logging.getLogger("netra.groq")



class GroqClient:
    """Manages Groq API calls with rotating keys and a model fallback chain."""

    def __init__(self) -> None:
        self._settings = settings
        self._rotator = key_rotator

    # ── Key helpers ───────────────────────────────────────────────────────

    def get_next_key(self) -> str:
        """Return the current API key."""
        return self._rotator.current_key

    def rotate_key(self) -> str:
        """Move to the next API key and return it."""
        new_key = self._rotator.rotate()
        logger.info("Rotated to next Groq API key.")
        return new_key

    def _make_client(self, api_key: str | None = None) -> AsyncGroq:
        """Build an AsyncGroq client with the given (or current) key."""
        return AsyncGroq(api_key=api_key or self.get_next_key())

    # ── Core chat completion with fallback ────────────────────────────────

    async def chat_completion(
        self,
        messages: List[Dict[str, Any]],
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> str:
        """Send a chat completion request.

        If *model* is provided only that model is tried (with key rotation on
        rate-limit).  Otherwise, the full fallback chain is attempted.

        Returns the assistant's text content.
        """
        models_to_try = [model] if model else list(self._settings.MODEL_FALLBACK_CHAIN)

        last_error: Exception | None = None
        for mdl in models_to_try:
            # Try every API key before giving up on a model
            for _attempt in range(len(self._settings.GROQ_API_KEYS)):
                try:
                    client = self._make_client()
                    response = await client.chat.completions.create(
                        model=mdl,
                        messages=messages,  # type: ignore[arg-type]
                        temperature=temperature,
                        max_tokens=max_tokens,
                    )
                    content = response.choices[0].message.content
                    return content or ""
                except RateLimitError:
                    logger.warning("Rate limited on model %s — rotating key.", mdl)
                    self.rotate_key()
                    last_error = RateLimitError("Rate limited")
                except (APIError, APIConnectionError) as exc:
                    logger.warning("API error on model %s: %s — trying next.", mdl, exc)
                    # Fail fast on authentication error (401 status)
                    if hasattr(exc, "status_code") and exc.status_code == 401:
                        logger.error("Authentication failed (401) on Groq API.")
                        raise exc
                    self.rotate_key()
                    last_error = exc
                except Exception as exc:  # noqa: BLE001
                    logger.error("Unexpected error on model %s: %s", mdl, exc)
                    last_error = exc
                    break  # non-retryable
            logger.info("Exhausted keys for model %s, falling back.", mdl)

        raise RuntimeError(
            f"All models/keys exhausted. Last error: {last_error}"
        )

    # ── Vision: describe an image ─────────────────────────────────────────

    async def describe_image(self, image_base64: str) -> str:
        """Use the vision model to produce a textual description of an image."""
        messages: List[Dict[str, Any]] = [
            {
                "role": "system",
                "content": (
                    "You are an expert image analyst for a digital forensics platform "
                    "called NETRA. Describe the image in detail — mention people, text, "
                    "logos, locations, objects, colors, and any identifiable features. "
                    "Be factual and concise."
                ),
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "Describe this image in detail for reverse-image investigation purposes.",
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{image_base64}",
                        },
                    },
                ],
            },
        ]
        return await self.chat_completion(
            messages, model=self._settings.VISION_MODEL, temperature=0.3, max_tokens=1024
        )

    # ── Summarise findings ────────────────────────────────────────────────

    async def generate_summary(self, findings_text: str) -> str:
        """Produce an AI-generated summary of investigation findings."""
        messages: List[Dict[str, Any]] = [
            {
                "role": "system",
                "content": (
                    "You are NETRA, an AI-powered reverse-image forensics assistant. "
                    "Given a set of investigation findings (URLs, similarity scores, "
                    "domains), produce a clear, professional summary suitable for an "
                    "analyst report. Highlight key observations, patterns, risk "
                    "indicators, and recommend next steps. Use bullet points."
                ),
            },
            {
                "role": "user",
                "content": (
                    "Summarise the following investigation findings:\n\n"
                    f"{findings_text}"
                ),
            },
        ]
        return await self.chat_completion(messages, temperature=0.4, max_tokens=2048)


# ── Module-level singleton ────────────────────────────────────────────────

groq_client = GroqClient()
