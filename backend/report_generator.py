"""
NETRA Backend — Report generator.
Builds a comprehensive JSON report for a given case.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List

from database import (
    get_case,
    get_findings_for_case,
    get_timeline_for_case,
)
from groq_client import groq_client
from models import Finding, ReportData, TimelineEvent

logger = logging.getLogger("netra.report")


class ReportGenerator:
    """Generates structured JSON reports for completed investigations."""

    async def generate_json_report(self, case_id: str) -> Dict[str, Any]:
        """Build a full report dict for *case_id*.

        Returns a serialisable dictionary matching the ReportData model.
        """
        # ── Load data ─────────────────────────────────────────────────────
        case = await get_case(case_id)
        if case is None:
            raise ValueError(f"Case {case_id} not found.")

        findings_rows = await get_findings_for_case(case_id)
        timeline_rows = await get_timeline_for_case(case_id)

        findings = [Finding(**f) for f in findings_rows]
        timeline = [TimelineEvent(**t) for t in timeline_rows]

        # ── Summary statistics ────────────────────────────────────────────
        total = len(findings)
        high_conf = sum(1 for f in findings if f.confidence >= 70)
        medium_conf = sum(1 for f in findings if 40 <= f.confidence < 70)
        low_conf = sum(1 for f in findings if f.confidence < 40)
        avg_confidence = (
            round(sum(f.confidence for f in findings) / total, 2) if total else 0.0
        )
        avg_similarity = (
            round(sum(f.similarity_score for f in findings) / total, 2) if total else 0.0
        )

        # Unique domains
        domains: Dict[str, int] = {}
        for f in findings:
            d = f.domain or "unknown"
            domains[d] = domains.get(d, 0) + 1

        # Provider breakdown
        providers: Dict[str, int] = {}
        for f in findings:
            p = f.source_provider or "unknown"
            providers[p] = providers.get(p, 0) + 1

        # Top finding
        top_finding: Dict[str, Any] | None = None
        if findings:
            best = max(findings, key=lambda x: x.confidence)
            top_finding = {
                "source_url": best.source_url,
                "domain": best.domain,
                "confidence": best.confidence,
                "similarity_score": best.similarity_score,
            }

        summary_stats: Dict[str, Any] = {
            "total_findings": total,
            "high_confidence": high_conf,
            "medium_confidence": medium_conf,
            "low_confidence": low_conf,
            "average_confidence": avg_confidence,
            "average_similarity": avg_similarity,
            "unique_domains": len(domains),
            "domain_breakdown": domains,
            "provider_breakdown": providers,
            "top_finding": top_finding,
        }

        # ── AI summary (attempt to generate if not already present) ──────
        ai_summary: str | None = None
        if findings_rows:
            try:
                text_lines: List[str] = []
                for i, f in enumerate(findings_rows, 1):
                    text_lines.append(
                        f"{i}. {f['source_url']} — "
                        f"Similarity {f['similarity_score']:.1f}%, "
                        f"Confidence {f['confidence']:.1f}%, "
                        f"Domain {f.get('domain', 'N/A')}, "
                        f"Provider {f.get('source_provider', 'N/A')}"
                    )
                ai_summary = await groq_client.generate_summary("\n".join(text_lines))
            except Exception as exc:
                logger.warning("Report AI summary failed: %s", exc)
                ai_summary = f"AI summary unavailable: {exc}"

        # ── Build report ─────────────────────────────────────────────────
        report = ReportData(
            case_id=case_id,
            original_filename=case["original_filename"],
            status=case["status"],
            phash=case.get("phash"),
            created_at=case["created_at"],
            updated_at=case["updated_at"],
            findings=findings,
            timeline=timeline,
            summary_stats=summary_stats,
            ai_summary=ai_summary,
        )

        return report.model_dump()


# ── Module-level singleton ────────────────────────────────────────────────

report_generator = ReportGenerator()
