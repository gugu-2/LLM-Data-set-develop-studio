"""
Hypasia AI — Flywheel Collector.
Captures (prompt, response, correction) tuples from production inference.
Scores them and pushes into the local queue for eventual retraining.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from hypasia.schema import HypasiaRow
from hypasia.flywheel.queue import FlywheelQueue


class FlywheelCollector:
    """
    Drop-in SDK for capturing production failures.

    Usage:
        from hypasia.flywheel import FlywheelCollector
        collector = FlywheelCollector()

        # In your inference handler:
        response = model.generate(prompt)
        collector.capture(prompt=prompt, response=response)

        # When user provides a correction:
        collector.capture(prompt=prompt, response=response, correction=user_correction)
    """

    def __init__(
        self,
        queue_path: str = "hypasia_flywheel.db",
        auto_score: bool = True,
        api_key: Optional[str] = None,
    ):
        self.queue = FlywheelQueue(db_path=queue_path)
        self.auto_score = auto_score
        self.api_key = api_key

    def capture(
        self,
        prompt: str,
        response: str,
        correction: Optional[str] = None,
        source: str = "production",
        thumbs_up: Optional[bool] = None,
    ) -> HypasiaRow:
        """
        Capture a production interaction.

        Args:
            prompt: The user's input prompt.
            response: The model's output response.
            correction: Optional user-provided correction (the "right" answer).
            source: Identifier for the deployment (e.g. "chatbot-v1").
            thumbs_up: Optional explicit feedback signal.

        Returns:
            The HypasiaRow created from this interaction.
        """
        # Use correction as the target response if provided
        instruction = prompt
        target_response = correction if correction else response

        row = HypasiaRow(
            instruction=instruction,
            response=target_response,
            source=source,
            source_type="flywheel",
            raw_text=response,  # keep original model output for comparison
            date_extracted=datetime.now(timezone.utc).isoformat(),
        )

        # Auto-score if enabled
        if self.auto_score:
            try:
                from hypasia.scorer.heuristic import score_heuristic
                from hypasia.scorer.composite import compute_composite
                from hypasia.schema import assign_tier
                row.scores = score_heuristic(row)
                row.score = round(compute_composite(row.scores), 2)
                row.tier = assign_tier(row.score)
                row.tokens = len((row.instruction + " " + row.response).split())
            except Exception:
                pass  # Don't fail production inference if scoring errors

        # Store feedback signal
        if thumbs_up is not None:
            row.score = min(row.score + (2.0 if thumbs_up else -2.0), 10.0)

        self.queue.push(row)
        return row

    def queue_size(self) -> int:
        return self.queue.size()

    def flush(self) -> list[HypasiaRow]:
        """Return all queued rows and clear the queue."""
        return self.queue.drain()
