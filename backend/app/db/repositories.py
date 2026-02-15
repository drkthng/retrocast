"""CRUD repository functions for scenarios and analysis results."""

import json
import logging
from datetime import datetime, timezone
from typing import Optional
from uuid import uuid4

from app.db.database import get_connection
from app.models.results import AnalysisResult
from app.models.scenario import ScenarioCreate, ScenarioInDB, ScenarioSummary, ScenarioUpdate

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Scenarios
# ---------------------------------------------------------------------------

def create_scenario(payload: ScenarioCreate) -> ScenarioInDB:
    """Insert a new scenario and return the persisted model."""
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    scenario_id = str(uuid4())

    scenario = ScenarioInDB(
        id=scenario_id,
        created_at=now,
        updated_at=now,
        **payload.model_dump(),
    )

    with get_connection() as conn:
        conn.execute(
            "INSERT INTO scenarios (id, data, created_at, updated_at) VALUES (?, ?, ?, ?)",
            (scenario.id, scenario.model_dump_json(), now, now),
        )

    logger.info("Created scenario %s: %s", scenario.id, scenario.name)
    return scenario


def get_scenario(scenario_id: str) -> Optional[ScenarioInDB]:
    """Fetch a single scenario by ID, or None if not found."""
    with get_connection() as conn:
        row = conn.execute(
            "SELECT data FROM scenarios WHERE id = ?", (scenario_id,)
        ).fetchone()

    if row is None:
        return None
    return ScenarioInDB.model_validate_json(row["data"])


def list_scenarios() -> list[ScenarioSummary]:
    """Return lightweight summaries of all scenarios."""
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT s.data, ar.data AS result_data "
            "FROM scenarios s "
            "LEFT JOIN analysis_results ar ON s.id = ar.scenario_id "
            "ORDER BY s.updated_at DESC"
        ).fetchall()

    summaries: list[ScenarioSummary] = []
    for row in rows:
        scenario = ScenarioInDB.model_validate_json(row["data"])

        last_hit_rate: Optional[float] = None
        last_total_signals: Optional[int] = None
        if row["result_data"]:
            result = AnalysisResult.model_validate_json(row["result_data"])
            last_total_signals = result.total_signals
            if result.target_stats:
                last_hit_rate = result.target_stats[0].hit_rate_pct

        summaries.append(
            ScenarioSummary(
                id=scenario.id,
                name=scenario.name,
                description=scenario.description,
                underlying=scenario.underlying,
                data_source=scenario.data_source,
                num_conditions=len(scenario.conditions),
                num_targets=len(scenario.targets),
                last_run_hit_rate=last_hit_rate,
                last_run_total_signals=last_total_signals,
                created_at=scenario.created_at,
                updated_at=scenario.updated_at,
            )
        )
    return summaries


def update_scenario(scenario_id: str, payload: ScenarioUpdate) -> Optional[ScenarioInDB]:
    """Update an existing scenario. Returns None if not found."""
    existing = get_scenario(scenario_id)
    if existing is None:
        return None

    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    updated = ScenarioInDB(
        id=scenario_id,
        created_at=existing.created_at,
        updated_at=now,
        **payload.model_dump(),
    )

    with get_connection() as conn:
        conn.execute(
            "UPDATE scenarios SET data = ?, updated_at = ? WHERE id = ?",
            (updated.model_dump_json(), now, scenario_id),
        )

    logger.info("Updated scenario %s", scenario_id)
    return updated


def delete_scenario(scenario_id: str) -> bool:
    """Delete a scenario and its cached results. Returns True if found."""
    with get_connection() as conn:
        cursor = conn.execute("DELETE FROM scenarios WHERE id = ?", (scenario_id,))
    deleted = cursor.rowcount > 0
    if deleted:
        logger.info("Deleted scenario %s", scenario_id)
    return deleted


# ---------------------------------------------------------------------------
# Analysis Results
# ---------------------------------------------------------------------------

def save_result(result: AnalysisResult) -> None:
    """Upsert a cached analysis result for a scenario."""
    with get_connection() as conn:
        conn.execute(
            "INSERT OR REPLACE INTO analysis_results (scenario_id, data, run_date) "
            "VALUES (?, ?, ?)",
            (result.scenario_id, result.model_dump_json(), result.run_date),
        )
    logger.info("Saved analysis result for scenario %s", result.scenario_id)


def get_result(scenario_id: str) -> Optional[AnalysisResult]:
    """Get the cached analysis result for a scenario, or None."""
    with get_connection() as conn:
        row = conn.execute(
            "SELECT data FROM analysis_results WHERE scenario_id = ?",
            (scenario_id,),
        ).fetchone()

    if row is None:
        return None
    return AnalysisResult.model_validate_json(row["data"])
